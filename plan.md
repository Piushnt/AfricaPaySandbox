# PAYMENT SANDBOX AFRICA — Plan d’implémentation

## Objectif et périmètre

Construire un MVP exécutable d’une console SaaS de simulation de paiements Mobile Money pour le Bénin, sans collecte ni transfert d’argent réel. Les profils MTN MoMo Bénin, Moov Money Bénin et Celtiis Cash Bénin seront des profils de simulation configurables, sans prétendre décrire des règles officielles d’opérateurs. Le parcours visé couvre la console développeur, les projets et clés de test, l’initialisation et le cycle d’une transaction simulée, l’inspection des événements et webhooks, et une documentation API exploitable.

## Contrainte d’hébergement et décisions explicites

Le projet actuel est un projet Web géré Manus avec capacité serveur et base gérée activées. Cette base est compatible MySQL, et non PostgreSQL. Redis n’est pas activé. L’hébergement géré ne constitue pas le VPS demandé dans le document source et ne permet pas de déclarer qu’un Docker Compose a été déployé sur un VPS.

La cible de code reste **Next.js + NestJS + TypeScript**, avec Prisma et des contrats d’API portables. Pour faire fonctionner une démonstration persistante dans l’environnement géré, la configuration de développement utilisera l’accès de base gérée compatible MySQL. La préparation VPS fournira les fichiers et instructions pour PostgreSQL, Redis/BullMQ, Docker Compose et un reverse proxy HTTPS. Les configurations Prisma, migrations, variables et procédures de migration MySQL → PostgreSQL seront séparées et documentées : le changement d’environnement ne sera pas présenté comme un basculement automatique sans validation de schéma et de données.

Le service Redis managé n’est pas activé dans ce plan. Dans Manus, la livraison asynchrone sera conçue autour d’un outbox durable et d’un worker compatible avec le processus serveur disponible; sur VPS, BullMQ/Redis sera le mécanisme cible. Aucun coût Redis supplémentaire n’est engagé. Aucun vrai connecteur opérateur, traitement financier réel, chiffrement ou vérification d’e-mail reposant sur un service externe non configuré ne sera présenté comme opérationnel.

## Architecture envisagée

Monolithe modulaire en dépôt unique, avec interface Next.js sur le port géré et API NestJS sous `/v1`. Les appels navigateur utilisent des chemins relatifs et sont relayés par le serveur web vers l’API; les deux processus sont lancés par une seule commande de développement conforme à la plateforme. Le Compose VPS préparé contient `web`, `api`, `postgres`, `redis` et le reverse proxy HTTPS. Le conteneur `worker` BullMQ est reporté jusqu’à la livraison effective du worker; il ne doit pas être déclaré avec une entrée absente.

- `apps/web` : Next.js, React, TypeScript, Tailwind CSS, expérience développeur, dashboard, pages projets/transactions/webhooks, console de test et simulateur de téléphone/USSD.
- `apps/api` : NestJS, API REST `/v1`, modules auth, organisations, projets, clés, fournisseurs, paiements, remboursements, simulations, webhooks, audit et documentation.
- `packages/shared` et `packages/api-contracts` : modèles, validations et erreurs partagés; états et transitions de paiement centralisés.
- `packages/sdk-typescript` : SDK initial pour appels API et idempotence.
- `prisma/managed` et `prisma/vps` : schémas/migrations adaptés respectivement à MySQL géré et PostgreSQL VPS, avec contrat de données maintenu au niveau applicatif.
- `deploy/vps` : Dockerfile multi-cible web/API, Compose de préparation, configuration reverse proxy, exemples `.env` et guide opératoire; migrations/sauvegardes/restauration et worker BullMQ restent à livrer.

Le traitement de paiement est exclusivement simulé. L’idempotence est persistée et compare l’empreinte de la requête. Les transitions d’état sont validées côté service et historisées en événements. Une entrée outbox est créée dans la même transaction que le changement d’état; le worker la publie/rejoue et historise les tentatives de webhook avec signature HMAC-SHA256. Les URL de webhooks devront être validées et protégées contre SSRF avant livraison; les secrets ne seront jamais affichés après génération ni inscrits dans les logs.

## Design et direction artistique

Styles candidats (probabilités de queue, toutes inférieures à 0,10) : « Terminal éditorial noir et laiton » (0,06), « Laboratoire néon cobalt » (0,04), « Instrumentation sahélienne, charbon et jade » (0,08). Choix : **Instrumentation sahélienne, charbon et jade**.

- **Mouvement :** console d’observabilité contemporaine, dense mais calme, orientée développeurs.
- **Principes :** états immédiatement lisibles; hiérarchie typographique nette; actions de test visibles; données simulées toujours identifiées.
- **Couleurs :** charbon profond pour réduire la fatigue, jade comme accent distinctif de validation, ambre pour l’attente, rouge réservé aux erreurs; le code couleur ne suggère jamais un transfert réel.
- **Mise en page :** navigation latérale stable et espace principal orienté tâches, avec rail contextuel d’environnement Sandbox; vues détaillées en panneaux latéraux plutôt qu’en modales empilées.
- **Motifs :** marqueur permanent « SIMULATION », lignes d’événements horodatées et anneaux de progression transactionnelle.
- **Interaction et animation :** transitions d’état immédiates, animations courtes et discrètes; états de chargement explicites; aucune animation décorative qui masque le statut.
- **Typographie :** sans-serif lisible pour l’interface, police monospace réservée aux identifiants, payloads et exemples de code.
- **Essence de marque :** « Le terrain d’essai des paiements numériques africains, sans argent réel. » Traits : fiable, pédagogique, précis.
- **Voix :** concise et technique. Exemples : « Envoyez un paiement de test »; « Cet événement est simulé; aucun fonds n’a été déplacé. »
- **Wordmark :** nom en capitales accompagné d’un pictogramme de boucle transactionnelle formée de trois segments, sans symbole bancaire.
- **Couleur signature :** jade soutenu, réservé aux actions primaires et aux états confirmés.

## Limites assumées et mise en production

La première livraison est un MVP sandbox et non une plateforme financière de production. Les opérateurs sont simulés, les PIN ne sont que des valeurs fictives et aucun adaptateur de production ne sera activé. La base gérée de Manus et PostgreSQL sur VPS ne partagent pas un moteur SQL : le plan inclut deux configurations Prisma et un guide de portage, et tout transfert réel de données exigera export, conversion et validation. L’envoi d’e-mail de vérification, les sauvegardes chiffrées automatisées et HTTPS par domaine VPS nécessitent une configuration de secrets/services propres à l’opérateur de déploiement.

L’implémentation ne publiera pas le site et ne déploiera pas de VPS sans accès et autorisation explicites. Le projet sera préparé pour publication Manus après validation, et prêt à être transféré sur VPS à travers les fichiers d’infrastructure livrés.
