# PAYMENT SANDBOX AFRICA

Plateforme de développement pour créer et tester des intégrations de paiement Mobile Money en Afrique francophone, avec lancement initial au Bénin. Le MVP simule exclusivement des parcours de paiement : **aucun fonds réel n’est collecté ni transféré**. MTN Mobile Money Bénin, Moov Money Bénin et Celtiis Cash Bénin sont représentés comme des profils de test; ils ne constituent ni des règles officielles ni des intégrations opérateur.

## Cahier de bord des itérations

Les états qualifient le code, pas sa capacité à traiter des paiements réels : `dev` = implémenté, `simulé` = comportement de démonstration sans fonds, `prévu` = pas encore livré, `préparé` = fichiers d’infrastructure présents sans déploiement opérationnel.

| Itération | Nom | Livré | État |
|---|---|---|---|
| 0 | Socle & console développeur | Monorepo Next.js/NestJS, dashboard, documentation, fournisseurs béninois, Swagger, contrats partagés, schémas Prisma Manus-MySQL/VPS-PostgreSQL et configuration Docker de départ. | dev — socle; paiements en mémoire |
| 1 | Cycle canonique de paiement | Création, consultation, annulation, remboursements initiaux, idempotence, transitions et événements en mémoire. | dev — simulation uniquement; aucune persistance métier |
| 2 | Scénarios déterministes | Catalogue de 11 scénarios et endpoints `GET /v1/simulations/scenarios`, `POST /v1/simulations/payments/:paymentId/run`. | dev / simulé — 11 résultats déterministes |
| 3 | Authentification JWT | Login, cookie JWT HTTP-only, guard sur paiements/simulations/événements, vérification de session, logout, limite d’essais et contrôle anti-CSRF pour l’authentification par cookie. | dev — mode de démo local; configuration secrète obligatoire en production |
| 4 | Laboratoire visuel des scénarios | Page `/simulator` : formulaire, profils fournisseurs, choix des 11 cas, téléphone/USSD fictif et affichage du statut/événements; page `/login`. | dev / simulé — transactions uniquement en mémoire |
| 5 | Persistance multi-tenant | Prisma connecté au moteur de paiement, comptes/organisations/projets, clés API et outbox durable. | prévu |
| 6 | Webhooks & worker asynchrone | HMAC-SHA256, historique et rejeu, BullMQ worker, protection SSRF. | prévu — Redis peut être provisionné, worker non livré |
| 7 | VPS & opérations | PostgreSQL opérationnel, migrations, sauvegardes/restauration, déploiement VPS et vérification TLS. | préparé — fichiers Docker/Compose/Nginx; non déployé |

Ajouter une ligne datée par lot futur en conservant le nom, les travaux vérifiés et l’état réel; ne pas qualifier une simulation ou un déploiement préparatoire de production.

## Authentification actuelle

Les endpoints paiements, événements et simulation nécessitent un JWT en bearer ou le cookie HTTP-only `psa_access_token`. L’interface envoie `X-PSA-Request: dashboard` pour les appels par cookie. En mode non-production, identifiants locaux de démonstration : `demo@sandbox.local` / `Sandbox-Demo-Only!`. Ne jamais utiliser ce compte en production.

En production, `NODE_ENV=production` impose `JWT_SECRET`, `AUTH_USER_EMAIL` et `AUTH_PASSWORD_HASH` (hash bcryptjs, coût recommandé ≥ 12); le mode démo ne fournit pas de compte implicite. Le JWT a une durée d’une heure. En développement sans `JWT_SECRET`, le secret est généré en mémoire et invalide les sessions au redémarrage. Pour HTTPS, laisser `COOKIE_SECURE=true`; sur un serveur HTTP local uniquement, `COOKIE_SECURE=false` choisit le mode cookie local `SameSite=Lax`.

## Endpoints

Les routes sont préfixées par `/v1`; Swagger est disponible via `/api-docs`.

| Méthode | Route | Accès | Description |
|---|---|---|---|
| `POST` | `/v1/auth/login` | public | Authentifie par e-mail/mot de passe et pose le cookie JWT. |
| `GET` | `/v1/auth/me` | session JWT | Vérifie la session et renvoie l’identité minimale. |
| `POST` | `/v1/auth/logout` | public | Efface le cookie de session. |
| `GET` | `/v1/providers` | public | Catalogue des profils de simulation. |
| `GET` | `/v1/providers/:code/capabilities` | public | Capacités déclarées d’un profil sandbox. |
| `POST` | `/v1/payments` | JWT | Crée un paiement simulé; accepte `Idempotency-Key`. |
| `GET` | `/v1/payments` | JWT | Liste les paiements du processus en mémoire. |
| `GET` | `/v1/payments/:id` | JWT | Consulte un paiement. |
| `POST` | `/v1/payments/:id/cancel` | JWT | Annule si la transition est permise. |
| `POST` | `/v1/payments/:id/refunds` | JWT | Demande un remboursement simulé. |
| `GET` | `/v1/events` | JWT | Liste les événements en mémoire. |
| `GET` | `/v1/simulations/scenarios` | JWT | Liste les 11 scénarios déterministes. |
| `POST` | `/v1/simulations/payments/:paymentId/run` | JWT | Exécute un scénario si la transaction est `PENDING` ou `PROCESSING`. |
| `GET` | `/health` | public | Readiness API. |

Corps d’exécution d’un scénario : `{"scenario":"insufficient_funds"}`. Scénarios : `accepted`, `declined`, `insufficient_funds`, `invalid_number`, `unknown_number`, `expired`, `abandoned`, `pending`, `timeout`, `technical_error`, `provider_unavailable`.

## Exécuter le projet

Prérequis : Node.js 22 et npm 10. `npm install`, puis `npm run dev`; Next.js écoute sur 3000 et NestJS sur 3001. Pages : `/`, `/login`, `/simulator`, `/transactions`, `/docs`.

Vérifications : `npm run typecheck`, `npm test`, `npm run build`. Docker Compose se trouve dans `deploy/vps/compose.yml`, le Dockerfile multi-cibles dans `deploy/vps/Dockerfile`, le proxy HTTPS dans `nginx/vps.conf`; un moteur Docker est requis pour les vérifier, et il n’est pas présent dans le sandbox courant. Avant le lancement sur VPS, renseigner `deploy/vps/.env.example` (notamment les secrets JWT et le hash bcrypt) et fournir des certificats dans `deploy/vps/certs/`.

## Limites de livraison

L’API n’utilise pas encore Prisma pour la persistance courante; les transactions et les tentatives d’idempotence vivent en mémoire et disparaissent au redémarrage. L’isolation organisation/projet, les clés API, l’outbox durable, BullMQ, les webhooks, la protection SSRF et les migrations SQL n’ont pas été implémentés. Redis est préparé dans le Compose mais n’est pas utilisé par un worker livré. La base gérée Manus est MySQL-compatible; la cible VPS est PostgreSQL et nécessitera une migration/conversion vérifiée. **Cette version n’est pas une plateforme de production de paiement.** Aucun VPS n’a été déployé.
