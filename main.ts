import {
    App,
    Plugin,
    PluginSettingTab,
    Setting,
    MarkdownPostProcessorContext,
    Notice,
    TFolder,
    TFile,
    normalizePath
} from 'obsidian';

import * as path from 'path';
import * as crypto from 'crypto';
import { execFile as execFileCb } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';

const execFile = promisify(execFileCb);

// Interface for Plugin Settings
interface LatexRenderSettings {
    latexLanguageTag: string;
    preamble: string;
    pdflatexPath: string;
    dvisvgmPath: string;
    useShellEscape: boolean;
    cleanupEnabled: boolean;
}

// Default Settings
const DEFAULT_SETTINGS: LatexRenderSettings = {
    latexLanguageTag: 'latex tikz render',
    preamble: `\\documentclass[standalone, dvisvgm]{standalone}
\\usepackage{tikz}
\\usepackage{pgfplots}
\\pgfplotsset{compat=1.18}
\\usepackage{tikz-cd}
\\usepackage{circuitikz}
\\usepackage{chemfig}
\\usetikzlibrary{arrows, automata, positioning, calc, shapes, decorations.pathmorphing, decorations.markings}
\\begin{document}`,
    pdflatexPath: 'pdflatex',
    dvisvgmPath: 'dvisvgm',
    useShellEscape: false,
    cleanupEnabled: true,
};

const END_DOCUMENT = "\n\\end{document}";

export default class LatexRenderPlugin extends Plugin {
    settings: LatexRenderSettings;
    cacheDir: string;
    tempDir: string;

    async onload() {
        console.log('Loading Advanced LaTeX Renderer Plugin');
        await this.loadSettings();

        // Define plugin directories
        const pluginBaseDir = normalizePath(this.app.vault.configDir + '/plugins/' + this.manifest.id);
        this.cacheDir = normalizePath(pluginBaseDir + '/cache');
        this.tempDir = normalizePath(pluginBaseDir + '/temp');

        // Ensure cache and temp directories exist
        await this.ensureDirectoryExists(this.cacheDir);
        await this.ensureDirectoryExists(this.tempDir);

        // Add Settings Tab
        this.addSettingTab(new LatexRenderSettingTab(this.app, this));

        // Register Markdown Code Block Processor
        this.registerMarkdownCodeBlockProcessor(this.settings.latexLanguageTag, async (source, el, ctx) => {
            try {
                await this.processLatexBlock(source, el, ctx);
            } catch (error) {
                console.error(`LaTeX Render Error: ${error.message}`, error);
                this.displayError(el, `Failed to render LaTeX: ${error.message}`);
            }
        });
    }

    onunload() {
        console.log('Unloading Advanced LaTeX Renderer Plugin');
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
        new Notice("LaTeX Render settings saved. You may need to reload Obsidian for all changes.");
    }

    async ensureDirectoryExists(dirPath: string) {
        try {
            await this.app.vault.adapter.mkdir(dirPath);
        } catch (error) {
            console.error(`Failed to ensure directory ${dirPath} exists:`, error);
            new Notice(`Error: Could not create/access directory ${dirPath}.`);
            throw error;
        }
    }

    async processLatexBlock(source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) {
        el.empty();
        const loadingIndicator = el.createDiv({ cls: 'latex-loading' });
        loadingIndicator.setText('Chargement du rendu LaTeX...');
    
        try {
            const contentToHash = this.settings.preamble + source + this.settings.useShellEscape.toString();
            const hash = crypto.createHash('sha256').update(contentToHash).digest('hex');
            const cacheFileName = `${hash}.svg`;
    
            const absoluteCacheDir = this.app.vault.adapter.getFullPath(this.cacheDir);
            const absoluteTempDir = this.app.vault.adapter.getFullPath(this.tempDir);
    
            const cacheFilePath = normalizePath(path.join(absoluteCacheDir, cacheFileName));
            const tempBaseName = normalizePath(path.join(absoluteTempDir, hash));
    
            try {
                const cachedSvg = await fs.readFile(cacheFilePath, 'utf-8');
                this.displaySvg(el, cachedSvg);
                return;
            } catch (error) {
                if (error.code !== 'ENOENT') {
                    console.warn(`Cache read error for ${cacheFilePath}:`, error);
                }
            }
    
            const latexSource = this.settings.preamble + "\n" + source + END_DOCUMENT;
            const texFilePath = `${tempBaseName}.tex`;
    
            await fs.writeFile(texFilePath, latexSource, 'utf-8');
    
            const latexArgs = [
                '-interaction=nonstopmode',
                '-halt-on-error',
                '-output-format=dvi',
                '-jobname', hash,
            ];
            if (this.settings.useShellEscape) {
                latexArgs.push('-shell-escape');
            }
            latexArgs.push(`${hash}.tex`);
    
            await execFile(this.settings.pdflatexPath, latexArgs, { timeout: 15000, cwd: absoluteTempDir });
    
            const dviFilePath = `${tempBaseName}.dvi`;
            await fs.access(dviFilePath, fs.constants.R_OK);
    
            const svgFilePath = `${tempBaseName}.svg`;
            const dvisvgmArgs = ['--no-fonts', '--exact', '-o', svgFilePath, dviFilePath];
            await execFile(this.settings.dvisvgmPath, dvisvgmArgs, { timeout: 10000 });
    
            const generatedSvg = await fs.readFile(svgFilePath, 'utf-8');
            await fs.writeFile(cacheFilePath, generatedSvg, 'utf-8');
            this.displaySvg(el, generatedSvg);
        } catch (error) {
            this.displayError(el, `LaTeX Compilation Error:\n${error.message}`, source);
        } finally {
            loadingIndicator.remove();
        }
    }

    displaySvg(el: HTMLElement, svgContent: string) {
        el.empty();
        const container = el.createDiv({ cls: 'latex-rendered-svg' });
        container.innerHTML = svgContent;
    }

    displayError(el: HTMLElement, errorMessage: string, originalSource?: string) {
        el.empty();
        const errorContainer = el.createDiv({ cls: 'latex-render-error' });
        errorContainer.createEl('strong', { text: 'LaTeX Rendering Failed' });
        const messageBlock = errorContainer.createEl('pre');
        messageBlock.setText(errorMessage);

        if (originalSource) {
            errorContainer.createEl('hr');
            errorContainer.createEl('details', {}, (details) => {
                details.createEl('summary', { text: 'Show Original Code' });
                details.createEl('pre').createEl('code', { text: originalSource });
            });
        }
    }
}

class LatexRenderSettingTab extends PluginSettingTab {
    plugin: LatexRenderPlugin;

    constructor(app: App, plugin: LatexRenderPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();
        containerEl.createEl('h2', { text: 'Advanced LaTeX Renderer Settings' });

        new Setting(containerEl)
            .setName('Markdown Language Tag')
            .setDesc('The language tag for code blocks to be rendered.')
            .addText(text => text
                .setPlaceholder(DEFAULT_SETTINGS.latexLanguageTag)
                .setValue(this.plugin.settings.latexLanguageTag)
                .onChange(async (value) => {
                    this.plugin.settings.latexLanguageTag = value || DEFAULT_SETTINGS.latexLanguageTag;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('LaTeX Preamble')
            .setDesc('The LaTeX preamble to wrap around the code block content.')
            .addTextArea(text => {
                text.setPlaceholder(DEFAULT_SETTINGS.preamble)
                    .setValue(this.plugin.settings.preamble)
                    .onChange(async (value) => {
                        this.plugin.settings.preamble = value || DEFAULT_SETTINGS.preamble;
                        await this.plugin.saveSettings();
                    });
                text.inputEl.rows = 15;
                text.inputEl.style.width = '100%';
                text.inputEl.style.fontFamily = 'monospace';
            });

        new Setting(containerEl)
            .setName('Use -shell-escape')
            .setDesc('Enable the -shell-escape flag for pdflatex and dvisvgm.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.useShellEscape)
                .onChange(async (value) => {
                    this.plugin.settings.useShellEscape = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('pdflatex Path')
            .setDesc('Path to the pdflatex executable.')
            .addText(text => text
                .setPlaceholder(DEFAULT_SETTINGS.pdflatexPath)
                .setValue(this.plugin.settings.pdflatexPath)
                .onChange(async (value) => {
                    this.plugin.settings.pdflatexPath = value || DEFAULT_SETTINGS.pdflatexPath;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('dvisvgm Path')
            .setDesc('Path to the dvisvgm executable.')
            .addText(text => text
                .setPlaceholder(DEFAULT_SETTINGS.dvisvgmPath)
                .setValue(this.plugin.settings.dvisvgmPath)
                .onChange(async (value) => {
                    this.plugin.settings.dvisvgmPath = value || DEFAULT_SETTINGS.dvisvgmPath;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Enable Temporary File Cleanup')
            .setDesc('Automatically delete temporary files after successful compilation.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.cleanupEnabled)
                .onChange(async (value) => {
                    this.plugin.settings.cleanupEnabled = value;
                    await this.plugin.saveSettings();
                }));
    }
}
