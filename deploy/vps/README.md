# Déploiement VPS (préparation)

Cette configuration prépare Docker Compose pour Next.js, NestJS, PostgreSQL, Redis et Nginx. Aucun VPS n’est connecté ou déployé par le présent projet. Le scénario d’argent réel est absent; garder `DEMO_MODE=true`.

## Pré-requis

VPS Linux avec Docker Engine + Compose plugin, nom DNS pointant vers le serveur, ports 80/443 autorisés et certificats TLS valides. Créer une sauvegarde du projet et ne jamais exposer directement les ports PostgreSQL/Redis.

## Démarrage

1. Depuis la racine, copier `deploy/vps/.env.example` vers `deploy/vps/.env` et remplacer chaque secret par une valeur aléatoire forte distincte. La valeur utilisateur/mot de passe de `DATABASE_URL` doit correspondre à `POSTGRES_USER`/`POSTGRES_PASSWORD` et être URL-encodée au besoin.
2. Définir `server_name` et les chemins des certificats dans `nginx/vps.conf`; déposer le certificat et sa clé dans `deploy/vps/certs/` avec permissions restreintes. En production, renouveler automatiquement les certificats et tester le renouvellement.
3. Depuis la racine : `docker compose --env-file deploy/vps/.env -f deploy/vps/compose.yml up --build -d`.
4. Appliquer les migrations VPS après validation du schéma : `cd apps/api && npx prisma migrate deploy --schema prisma/vps/schema.prisma` (les fichiers de migration PostgreSQL devront être générés/revus avant le premier déploiement).
5. Vérifier `/health`, `/api-docs` et `/v1/providers`, puis vérifier les journaux et le fonctionnement des sauvegardes/restaurations avant d’exposer le service.

## Portage Manus (MySQL géré) vers PostgreSQL VPS

Le schéma `prisma/managed/schema.prisma` est prévu pour la base MySQL gérée de Manus; `prisma/vps/schema.prisma` cible PostgreSQL. Ces schémas ne partagent pas une chaîne de migrations et la session actuelle n’a pas encore implémenté de dépôt Prisma branché au moteur de paiements. Avant toute migration de données : geler les écritures, exporter MySQL, convertir les types et clés, importer dans une base PostgreSQL de préproduction, comparer volumes et contraintes, valider les états/événements, puis planifier une fenêtre de bascule et un retour arrière. Il ne faut pas remplacer simplement le DSN.

## Sauvegarde et restauration

Le volume Postgres doit être sauvegardé hors serveur, chiffré avec gestion externe de clé, horodaté et soumis à un test périodique de restauration. Redis contient uniquement des données reconstructibles; l’outbox durable doit rester en PostgreSQL. Le compose fourni ne configure pas à lui seul la politique de rétention, le chiffrement de sauvegarde ou le renouvellement TLS : ils doivent être ajoutés à l’exploitation du VPS.
