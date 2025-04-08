# Advanced LaTeX Renderer pour Obsidian

Ce plugin pour Obsidian permet de générer et d'afficher des rendus SVG de haute qualité à partir de blocs de code LaTeX directement dans vos notes. Il est particulièrement adapté pour les schémas complexes utilisant des packages comme TikZ, pgfplots, tikz-cd, circuitikz, chemfig, et bien d'autres, en s'appuyant sur votre installation LaTeX locale.

## Fonctionnalités

* **Rendu LaTeX Avancé :** Compile des blocs de code LaTeX via `pdflatex`.
* **Conversion SVG :** Utilise `dvisvgm` pour convertir la sortie DVI en SVG vectoriel.
* **Support Étendu :** Conçu pour fonctionner avec les packages graphiques populaires (TikZ, pgfplots, etc.).
* **Préambule Configurable :** Personnalisez facilement les packages LaTeX chargés via les paramètres du plugin.
* **Mise en Cache Intelligente :** Génère un rendu seulement si le contenu du bloc ou le préambule a changé, pour des performances optimales. Bouton pour vider le cache manuellement.
* **Chemins Configurables :** Spécifiez les chemins d'accès à vos exécutables `pdflatex` et `dvisvgm`.
* **Gestion des Erreurs :** Affiche les erreurs de compilation LaTeX directement dans la note à la place du rendu.
* **Indicateur de Chargement :** Affiche un message "Rendu en cours..." pendant la compilation.
* **Nettoyage Optionnel :** Possibilité de conserver les fichiers temporaires (`.tex`, `.log`, `.aux`, `.dvi`) pour le débogage.
* **Option `-shell-escape` :** Possibilité d'activer l'option `-shell-escape` pour `pdflatex` et `dvisvgm` (à utiliser avec prudence).

## Prérequis (Installation Locale Nécessaire)

Ce plugin **requiert** que vous ayez les logiciels suivants installés et fonctionnels sur votre système :

1.  **Une Distribution LaTeX Complète :**
    * Par exemple : **TeX Live** (recommandé sur Linux/macOS), **MiKTeX** (Windows), ou **MacTeX** (macOS).
    * Assurez-vous que la commande `pdflatex` est accessible depuis votre terminal.
2.  **L'exécutable `dvisvgm` :**
    * Cet outil est généralement **inclus** dans les installations complètes de TeX Live et MacTeX. Il pourrait nécessiter une installation séparée ou être inclus dans un package spécifique avec MiKTeX.
    * Assurez-vous que la commande `dvisvgm` est accessible depuis votre terminal.

*Comment vérifier ?* Ouvrez un terminal et tapez `pdflatex --version` puis `dvisvgm --version`. Si les commandes sont reconnues, vous êtes prêt. Sinon, vous devrez compléter votre installation LaTeX ou ajuster votre variable d'environnement `PATH`.

## Installation du Plugin

**(Note : Ce plugin n'est pas encore sur le store communautaire d'Obsidian)**

1.  Téléchargez les fichiers du plugin : `main.js`, `styles.css`, et `manifest.json`.
2.  Créez un nouveau dossier dans le répertoire des plugins de votre coffre Obsidian : `VOTRE_COFFRE/.obsidian/plugins/advanced-latex-renderer` (vous pouvez choisir un autre nom de dossier si vous préférez, mais l'ID dans `manifest.json` doit être cohérent).
3.  Placez les fichiers `main.js`, `styles.css`, et `manifest.json` téléchargés directement dans ce dossier.
4.  Redémarrez Obsidian ou rechargez les plugins.
5.  Allez dans `Réglages` > `Plugins communautaires`.
6.  Trouvez "Advanced LaTeX Renderer" dans la liste et activez-le.

## Configuration

Accédez aux réglages du plugin via `Réglages` > `Plugins communautaires` > `Advanced LaTeX Renderer` (cliquez sur l'icône ⚙️).

Voici les options disponibles :

* **Markdown Language Tag:**
    * La balise de langage à utiliser pour identifier les blocs de code à rendre (par ex. ` ```latex tikz render `).
    * Défaut : `latex tikz render`
    * *Note : Un rechargement d'Obsidian peut être nécessaire pour que les changements prennent effet.*
* **LaTeX Preamble:**
    * Le préambule LaTeX qui sera utilisé pour envelopper le contenu de chaque bloc de code. C'est ici que vous ajoutez ou retirez des `\usepackage{...}`.
    * Le préambule par défaut inclut `standalone`, `tikz`, `pgfplots`, `tikz-cd`, `circuitikz`, `chemfig`, `fontenc (T1)`, `inputenc (utf8)`, `amsmath`, `amssymb`, `textcomp` et quelques librairies TikZ utiles. Modifiez-le selon vos besoins.
    * *Important : Modifier le préambule invalidera le cache et forcera la recompilation des blocs.*
* **pdflatex Path:**
    * Le chemin vers l'exécutable `pdflatex`.
    * Défaut : `pdflatex` (suppose qu'il est dans le PATH système).
    * Si la commande n'est pas trouvée, utilisez `which pdflatex` (macOS/Linux) ou `where pdflatex` (Windows) dans un terminal pour trouver le chemin complet et collez-le ici.
* **dvisvgm Path:**
    * Le chemin vers l'exécutable `dvisvgm`.
    * Défaut : `dvisvgm` (suppose qu'il est dans le PATH système).
    * Si la commande n'est pas trouvée, utilisez `which dvisvgm` ou `where dvisvgm` pour trouver le chemin complet et collez-le ici.
* **Use -shell-escape:**
    * Active l'option `-shell-escape` pour `pdflatex` et `dvisvgm`.
    * **AVERTISSEMENT DE SÉCURITÉ :** N'activez ceci que si vous comprenez les implications et que vous ne compilez que du code LaTeX de confiance. Cela permet à LaTeX d'exécuter des commandes externes arbitraires.
    * Défaut : Désactivé.
* **Enable Temporary File Cleanup:**
    * Si activé, supprime les fichiers temporaires (`.tex`, `.log`, `.aux`, `.dvi`, `.svg` temporaire) après la compilation. Désactivez pour inspecter ces fichiers en cas de problème.
    * Défaut : Activé.
* **Clear Render Cache:**
    * Supprime tous les SVG mis en cache par le plugin. Utile si vous suspectez un problème de cache ou si vous voulez forcer la régénération de toutes les images.

## Usage

Créez simplement un bloc de code dans une note Obsidian en utilisant la balise de langage configurée dans les paramètres (par défaut `latex tikz render`). Écrivez votre code LaTeX (généralement le contenu d'un environnement `tikzpicture`, `circuitikz`, `chemfig`, etc.) à l'intérieur.

**Exemple :**

````markdown
```latex tikz render
\begin{tikzpicture}
    \draw[blue, ultra thick] (0,0) circle (1.5cm);
    \node[red, scale=2] at (0,0) {Test!};
    % Ajout de maths pour tester le préambule
    \node[below=2cm] {$\int_a^b f(x) dx = F(b) - F(a)$};
\end{tikzpicture}
```
````

Passez en mode Lecture (Preview) pour voir le résultat. Pendant la compilation (la première fois ou si le code change), un message "Rendu en cours..." devrait s'afficher brièvement.

## Fonctionnement Interne

* **Détection :** Le plugin scanne les blocs de code correspondant à la balise configurée.
* **Cache :** Un hash du contenu du bloc + du préambule est généré. Si un SVG correspondant existe dans le cache (`VOTRE_COFFRE/.obsidian/plugins/ID_PLUGIN/cache/`), il est affiché directement.
* **Compilation :**
    1.  Le contenu du bloc est enveloppé dans le préambule configuré pour créer un fichier `.tex` complet dans un dossier temporaire (`VOTRE_COFFRE/.obsidian/plugins/ID_PLUGIN/temp/`).
    2.  `pdflatex` est appelé (avec `-output-format=dvi`) pour compiler le `.tex` en `.dvi`.
    3.  `dvisvgm` est appelé pour convertir le `.dvi` en `.svg` (avec l'option `--no-fonts` pour une meilleure compatibilité et un espacement correct, au détriment potentiel de la netteté des glyphes).
    4.  Le fichier `.svg` résultant est lu.
    5.  Le SVG est stocké dans le cache.
    6.  Les fichiers temporaires sont supprimés (si l'option est activée).
* **Affichage :** Le contenu SVG est inséré dans la page à la place du bloc de code.
* **Erreurs :** Si `pdflatex` ou `dvisvgm` échoue, le plugin essaie de lire le fichier `.log` de LaTeX et affiche un message d'erreur formaté.

## Dépannage

* **"pdflatex not found" / "dvisvgm not found" (ou erreur ENOENT):** Vérifiez les chemins dans les réglages du plugin. Utilisez `which` ou `where` pour trouver les chemins absolus et collez-les dans les paramètres. Assurez-vous que LaTeX/dvisvgm sont correctement installés.
* **Erreur de compilation LaTeX affichée :** L'erreur vient de votre code LaTeX ou d'un package manquant. Vérifiez votre code et assurez-vous que tous les `\usepackage` nécessaires sont dans le préambule (via les réglages). Pour plus de détails, désactivez le nettoyage des fichiers temporaires et examinez le fichier `.log` dans le répertoire `temp`.
* **Le texte dans le SVG n'est pas très net :** C'est une conséquence de l'utilisation de `dvisvgm --no-fonts` pour assurer un espacement correct. Une alternative (workflow `pdflatex` -> PDF -> `pdf2svg` ou `pdftocairo`) pourrait donner un meilleur texte mais requiert l'installation d'outils supplémentaires et des modifications du plugin.
* **Le rendu ne se met pas à jour :** Essayez le bouton "Clear Render Cache" dans les réglages. Vérifiez que le préambule ou le code a bien changé si vous vous attendez à une recompilation.

## Limitations

* Nécessite une installation locale complète de LaTeX et `dvisvgm`.
* La performance dépend de la complexité de vos schémas et de la vitesse de votre machine. La mise en cache aide beaucoup pour les visualisations répétées.
* L'activation de `-shell-escape` présente un risque de sécurité.
* La qualité du rendu du texte est un compromis (espacement correct vs netteté des glyphes) avec la méthode `dvisvgm --no-fonts` actuelle.
