## Etat session 2026-11-09

**Fait :** diagnostic du formulaire `contact` : il marche (détecté par Netlify, 2 soumissions reçues le 6 oct. et le 29 oct.) ; il n'a aucune notification email, donc personne n'est prévenu ; depuis le 2026-11-03, Netlify n'accepte comme destinataire qu'un membre de l'équipe, et le plan Free n'a qu'un membre ; décision : recréer le projet dans un compte Netlify de Vania.
**Prochain :** tâches de Jonathan dans `cerveau/10-Projets/wania/wania-human.md` (export des soumissions, puis migration selon le plan ci-dessous). Après la bascule : supprimer `.netlify/state.json` du repo local.
**Pieges :** le domaine ne peut être que sur un seul projet (le retirer de `casavjm` avant de l'ajouter ailleurs) ; les soumissions ne suivent pas ; l'OAuth GitHub du CMS est à réinstaller dans le nouveau projet ; une fois le site chez Vania, Jonathan n'a plus le dashboard.
**Commit :** 534bc5e docs(news-grille-heure): fiche feature, index, plan et décisions (aucun code cette session)

---

# Migration Netlify vers le compte de Vania

> **Statut** : EN COURS (opérations, aucun code) · **Ouvert** : 2026-11-09

## Pourquoi
Le formulaire `contact` envoie bien, mais personne n'est notifié. Depuis le 2026-11-03, Netlify n'envoie les notifications de formulaire qu'à l'adresse d'un membre de l'équipe ([changelog](https://www.netlify.com/changelog/2026-11-03-new-email-requirements-for-form-notifications/)). Sur le plan Free, l'équipe n'a qu'une personne, Jonathan. Le site part donc dans un compte Netlify créé avec `vania@vjmvjmvjm.com`.

## État actuel (relevé 2026-11-09)
- Projet `casavjm` (id `f187cc9a-bdfe-47c8-9531-039fc51de39e`) dans l'équipe de Jonathan, repo `jonathanvouilloz/vjmvjmvjm`, branche `main`, deploys limités à `main`.
- Formulaire `contact` id `6ac3661aca294e000837e36d`, honeypot actif, 2 soumissions, aucune notification.
- Variables d'env : `NODE_VERSION` et `PYTHON_VERSION` seulement (déjà dans `netlify.toml`).
- DNS chez Infomaniak (ns11/ns12) : A `75.2.60.5` (load balancer Netlify), `www` en CNAME vers le projet. MX Infomaniak.

## Plan
1. Exporter les soumissions (CSV + PNG des dessins) depuis Forms → `contact`.
2. Vania : compte GitHub, collaboratrice du repo.
3. Vania : compte Netlify avec `vania@vjmvjmvjm.com`, import du repo depuis GitHub, branche `main`. Le build vient de `netlify.toml`.
4. Branches : production branch only, deploy previews désactivées (plan Free).
5. Forms : activer la détection, relancer un deploy, ajouter une notification email vers `vania@vjmvjmvjm.com`.
6. Access & security → OAuth → provider GitHub (Client ID et Secret de l'OAuth App, callback `https://api.netlify.com/auth/done`).
7. Retirer `vjmvjmvjm.com` de `casavjm`, l'ajouter au nouveau projet, pointer le CNAME `www` vers `<nouveau>.netlify.app`, attendre le certificat HTTPS.
8. Tester : formulaire avec dessin (le mail arrive), connexion `/admin/`, « Publish Changes ».
9. Supprimer `casavjm` et `.netlify/state.json` en local.

`.github/workflows/publier.yml` ne dépend pas de Netlify : rien à changer.

## Carte du code
> Mise a jour : 2026-11-09

| Fichier | Role |
|---------|------|
| `src/pages/contact.astro` | Formulaire Netlify `contact` (honeypot, PNG du dessin joint en multipart, POST sur `/`) ; inchangé, il fonctionne |
| `netlify.toml` | Build, Node/Python et branche `content` ignorée : c'est tout ce que le nouveau projet reprend |
| `public/admin/config.yml` | Backend GitHub du CMS : sa connexion passe par l'OAuth du projet Netlify |
| `.netlify/state.json` | Lien CLI vers `casavjm`, à retirer après la bascule |

### Decisions cles
- Recréer le projet plutôt que le transférer : un transfert demande un membre commun aux deux équipes, impossible entre deux comptes Free sans passer par le support.
