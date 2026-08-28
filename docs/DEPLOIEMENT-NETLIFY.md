# Déploiement Netlify — vjmvjmvjm.com

## Construire l’archive

Depuis la racine du projet :

```bash
npm test
npm run build
npm run package:netlify
```

Le livrable est `waniushka-netlify.zip`. Le script place `index.html`, le bundle et les assets directement à la racine de l’archive.

## Déployer

L’archive fait environ 106 Mo. À cette taille, utiliser **Netlify CLI** plutôt que le glisser-déposer :

```bash
npx netlify-cli deploy --dir=dist
# vérifier l’URL de prévisualisation, puis :
npx netlify-cli deploy --prod --dir=dist
```

À la première exécution, Netlify demande de se connecter puis de choisir le site cible. `waniushka-netlify.zip` reste un livrable de transport ou une solution de secours, mais le glisser-déposer est moins fiable pour une archive de cette taille.

Après le déploiement :

1. vérifier dans **Forms** que le formulaire `contact` est détecté ;
2. dans **Forms → Form notifications**, ajouter une notification vers `hello@vjmvjmvjm.com` ;
3. dans **Domain management**, rattacher `vjmvjmvjm.com` puis appliquer chez le registrar les enregistrements DNS indiqués par Netlify ;
4. attendre l’émission du certificat HTTPS.

## Test de réception

Depuis `https://vjmvjmvjm.com/` :

1. ouvrir **Dessin & contact** ;
2. tracer un dessin ;
3. remplir nom, e-mail et message ;
4. envoyer ;
5. vérifier le message de succès ;
6. vérifier la soumission dans **Netlify → Forms → contact** ;
7. vérifier que le champ `dessin` contient un PNG et que la notification arrive à `hello@vjmvjmvjm.com`.

Le formulaire est envoyé en `multipart/form-data`. Le PNG n’est ajouté que si un dessin a réellement été tracé. En cas d’échec, les champs et le dessin restent présents pour permettre une nouvelle tentative.
