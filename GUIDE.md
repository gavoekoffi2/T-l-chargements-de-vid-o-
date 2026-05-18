# 🎬 Guide ultra simple — comment monter ta vidéo

Tu n'as **rien à installer**, pas de terminal, pas de code. Tout se fait
depuis le site GitHub avec quelques clics.

---

## 🟢 Méthode A — Le bouton magique GitHub (aucune installation)

### Étape 1 — Ouvre l'onglet "Actions" de ton repo

👉 Va sur cette page dans ton navigateur :

**https://github.com/gavoekoffi2/T-l-chargements-de-vid-o-/actions**

> Si GitHub te dit « Workflows aren't being run on this forked repository »
> ou « Enable Actions », clique sur le bouton vert pour activer Actions.

### Étape 2 — Choisis le workflow "Monter une vidéo TikTok"

Dans la colonne de gauche, clique sur **« Monter une vidéo TikTok »**.

### Étape 3 — Clique sur "Run workflow" (à droite)

Un petit menu s'ouvre. Remplis les champs :

| Champ              | Quoi mettre                                 | Exemple                              |
| ------------------ | ------------------------------------------- | ------------------------------------ |
| `youtube_url`      | L'URL de la vidéo YouTube à monter          | `https://youtu.be/yiuGeVaZs3s`       |
| `handle`           | Ton pseudo TikTok (affiché sur la vidéo)    | `@moncompte`                         |
| `min_seconds`      | Durée minimale d'un clip                    | `90`                                 |
| `max_seconds`      | Durée maximale d'un clip                    | `120`                                |
| `max_clips`        | Combien de clips MAX (vide = tous)          | _(laisse vide)_                      |

Puis clique sur le **gros bouton vert "Run workflow"**.

### Étape 4 — Attends que ça tourne (~10-20 min)

Tu verras une ligne apparaître dans la liste avec un petit point jaune
(en cours) puis vert (fini) ou rouge (erreur).

Clique sur cette ligne pour voir le progrès en direct.

### Étape 5 — Récupère tes vidéos

Quand c'est fini (point vert ✅) :

1. Reste sur la page du workflow qui vient de tourner
2. Scrolle tout en bas
3. Dans la section **« Artifacts »**, clique sur **`tiktok-clips`**
4. Un fichier ZIP se télécharge avec **tous tes clips TikTok** dedans
5. Décompresse le ZIP, tu as `clip-01.mp4`, `clip-02.mp4`, … à publier ❤️

---

## 🟡 Si YouTube refuse le téléchargement

YouTube bloque parfois les téléchargements depuis GitHub. Le workflow va
te le dire en rouge avec un message « 403 Forbidden » ou « Sign in to
confirm you're not a bot ».

Dans ce cas, voici la **méthode de secours** :

1. Télécharge la vidéo YouTube toi-même (avec n'importe quel site type
   `cobalt.tools`, `yt1d.com`, ou en utilisant ton Drive comme tu as déjà fait)
2. Sur ton repo GitHub, va dans **« Releases »** (colonne de droite) →
   **« Create a new release »**
3. Donne un nom (ex. `source-1`) et **glisse la vidéo MP4** dans la zone
   « Attach binaries »
4. Publie la release
5. **Copie le lien direct du MP4** (clic-droit dessus → « Copier l'adresse
   du lien »)
6. Relance le workflow avec ce lien à la place de l'URL YouTube

---

## 🔴 En cas d'erreur

Va dans l'onglet **Actions** → clique sur le workflow qui a échoué
(point rouge) → l'erreur s'affiche en bas. Copie-la et colle-la moi, je
te débogue.

Si tu vois un artifact `debug` à la fin, télécharge-le aussi — il
contient les fichiers intermédiaires qui m'aident à comprendre où ça
coince.

---

## 🆘 Si même ça est trop compliqué

Demande-moi de te le faire en visio / partage d'écran via Claude Code,
ou de te générer une vidéo de démo en commentant juste « démo » dans le
chat. Je suis là 🤝
