# PAYMENT SANDBOX AFRICA

Plateforme de développement pour créer et tester des intégrations de paiement Mobile Money en Afrique francophone, avec un lancement initial au Bénin. Le MVP simule uniquement des parcours de paiement : **aucun fonds réel n’est collecté ou transféré**. Les profils MTN Mobile Money Bénin, Moov Money Bénin et Celtiis Cash Bénin sont des profils de simulation paramétrables, et ne constituent pas des règles officielles ni des intégrations opérateur.

## Cahier de bord des itérations

Chaque livraison est consignée ici avec son nom, son contenu et son état. Une fonctionnalité marquée **dev** est implémentée dans le code; une fonctionnalité marquée **simulé** décrit des comportements de démonstration sans argent réel. Ces états ne signifient pas « production ».

| Itération | Nom | Réalisé | État |
|---|---|---|---|
| 0 | Socle & console développeur | Monorepo TypeScript Next.js/NestJS, dashboard, documentation initiale, catalogue des profils béninois, Swagger, contrats partagés, modèles Prisma Manus-MySQL/VPS-PostgreSQL et fichiers de préparation VPS. | dev — socle; fournisseurs et paiements en mémoire pour le moment |
| 1 | Cycle de paiement canonique | Création/consultation/annulation de paiement, remboursements initiaux, validation de transitions, événements en mémoire et protection d’idempotence en mémoire. | dev — comportements simulés; pas de persistance DB branchée |
| 2 | API des scénarios de simulation | Découverte des scénarios disponibles et exécution déterministe d’un scénario sur un paiement en attente/en traitement; événements de simulation ajoutés au cycle de vie. | dev — scénarios simulés; tests de contrat en cours |
| 3 | Persistance et isolation multi-tenant | Prévu : Prisma opérationnel, données organisation/projet isolées, clés API et persistance de l’idempotence/outbox. | prévu |
| 4 | Webhooks & simulateur de téléphone | Prévu : HMAC-SHA256, tentative/rejeu, scénarios USSD interactifs et inspection des payloads. | prévu |
| 5 | Authentification, administration & durcissement | Prévu : comptes, sessions, rôles, vérification e-mail, quotas, audit, SSRF et secrets. | prévu |
| 6 | Migration et déploiement VPS | Prévu : vérification des migrations PostgreSQL, worker BullMQ/Redis, certificats, sauvegarde/restauration et déploiement sur un VPS autorisé. | préparé — non déployé |

À chaque itération ultérieure, ajouter une ligne datée avec le nom de l’itération, le travail réellement livré et l’état (`dev`, `simulé`, `prévu`, `bloqué` ou `production`). Ne pas déclarer « production » sans déploiement et vérifications de sécurité correspondants.

## Endpoints actuellement implémentés

Tous les endpoints sandbox sont sous `/v1` et documentés dans Swagger à `/api-docs`.

| Méthode | Route | Description |
|---|---|---|
| `GET` | `/v1/providers` | Catalogue des profils fournisseurs de simulation. |
| `GET` | `/v1/providers/:code/capabilities` | Capacités déclarées d’un profil sandbox. |
| `POST` | `/v1/payments` | Crée un paiement simulé; prend en charge `Idempotency-Key`. |
| `GET` | `/v1/payments` | Liste les paiements simulés du processus en mémoire. |
| `GET` | `/v1/payments/:id` | Consulte un paiement. |
| `POST` | `/v1/payments/:id/cancel` | Annule un paiement lorsque la transition est valide. |
| `POST` | `/v1/payments/:id/refunds` | Demande un remboursement simulé. |
| `GET` | `/v1/events` | Consulte les événements du processus en mémoire. |
| `GET` | `/v1/simulations/scenarios` | Liste les scénarios de simulation supportés. |
| `POST` | `/v1/simulations/payments/:paymentId/run` | Applique un scénario à un paiement en état `PENDING` ou `PROCESSING`. |
| `GET` | `/health` | Vérification de disponibilité du service API. |

### Lancer un scénario

```bash
curl -X POST http://localhost:3000/v1/simulations/payments/pay_123/run \
  -H 'Content-Type: application/json' \
  -d '{"scenario":"insufficient_funds"}'
```

Scénarios actuels : `accepted`, `declined`, `insufficient_funds`, `invalid_number`, `unknown_number`, `expired`, `abandoned`, `pending`, `timeout`, `technical_error` et `provider_unavailable`. Pour des tests déterministes, le scénario doit être choisi explicitement; il ne s’agit pas de probabilités opérateur réelles.

## Développement local du projet

Prérequis : Node.js 22 et npm 10. Installer les dépendances à la racine avec `npm install`, puis démarrer les applications avec `npm run dev`. Next.js écoute sur le port 3000 et NestJS sur le port 3001; la console transmet les appels `/v1/...` à l’API.

Vérifications disponibles : `npm run typecheck`, `npm test` et `npm run build`.

## Hébergement et limites actuelles

L’environnement géré Manus fournit une base compatible MySQL; le schéma de migration VPS vise PostgreSQL. Les deux moteurs ont des schémas distincts : un changement de DSN seul ne réalise pas une migration de données. Les scénarios et transactions de ce socle sont conservés en mémoire et perdus au redémarrage. Prisma, authentification, isolation par projet, worker/outbox durable, webhooks et vraie gestion de secrets ne sont pas encore connectés au parcours courant. L’API n’est pas prête à recevoir des paiements réels ou à être exposée comme plateforme de production.

Les fichiers de déploiement préparatoires se trouvent dans `deploy/vps/`; l’application n’a pas été déployée sur le VPS.
