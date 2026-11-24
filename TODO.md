# TODO — PAYMENT SANDBOX AFRICA

État : interface, API JWT et fichiers de préparation VPS de l’itération courante implémentés; les limites d’exploitation sont indiquées explicitement. Les livraisons ponctuelles ci-dessous sont cochées après vérification du code, du build et des requêtes locales. Les exigences générales non livrées restent ouvertes.

## Itération courante — simulateur visuel, JWT et préparation VPS

- [x] Ajouter sur Next.js `/simulator` pour choisir un des profils MTN, Moov ou Celtiis, saisir montant/numéro fictifs, choisir les 11 scénarios et visualiser le résultat de l’appel API, l’état, la timeline d’événements et un téléphone USSD fictif. Les valeurs PIN affichées sont purement décoratives; aucune valeur PIN n’est transmise. Aucun fonds réel n’est transféré.
- [x] Ajouter `/login` et l’authentification JWT NestJS par cookie HTTP-only, une session d’une heure, logout/vérification de session, limite de tentatives et guard sur paiements, événements et scénarios; exiger `X-PSA-Request: dashboard` pour les requêtes protégées par cookie.
- [x] Préparer Dockerfile multi-cible, Compose avec API/web/PostgreSQL/Redis/Nginx TLS, exemples d’environnement de production et guide VPS. Compose exige les secrets JWT/compte/hash bcrypt et désactive le mode démo par défaut. Redis reste non consommé; aucun worker BullMQ n’est fourni.
- [ ] Valider la stack Docker sur un moteur Docker et la déployer/tester sur un VPS (Docker indisponible dans le sandbox et aucun VPS connecté).

## Console développeur et navigation responsive

- [ ] Construire une interface moderne, soignée et responsive (desktop, tablette, mobile), orientée développeurs, avec dark mode principal, typographie lisible, hiérarchie et espacements cohérents, tableaux filtrables, graphiques pertinents, animations discrètes, chargements soignés et retours d’état précis.
- [ ] Donner accès aux projets, clés API, fournisseurs actifs, transactions, événements, webhooks, console de test, simulateur virtuel, documentation interactive et vues d’administration prévues.
- [ ] Utiliser une identité originale inspirée des standards ergonomiques de plateformes développeurs, sans copier leur identité visuelle; afficher clairement que tous les flux sont simulés.

## API publique canonique et SDK

- [ ] Exposer une API REST versionnée `/v1/`, documentée OpenAPI/Swagger, avec authentification cohérente, validation stricte des entrées et erreurs structurées.
- [ ] Fournir au minimum `POST /v1/payments`, `GET /v1/payments/:id`, `POST /v1/payments/:id/cancel`, `POST /v1/refunds`, `GET /v1/refunds/:id`, `GET /v1/providers`, `GET /v1/providers/:code/capabilities` et `GET /v1/events`.
- [ ] Fournir un SDK TypeScript initial et des exemples de démarrage, authentification, paiements, consultation, annulation, remboursement, webhooks, erreurs, JavaScript/TypeScript, Python, PHP et collection Postman.
- [ ] Préserver le même contrat canonique `/v1/...` indépendamment des fournisseurs et documenter toute différence entre l’environnement sandbox géré Manus et la cible VPS.

## Utilisateurs, organisations, projets et clés

- [ ] Implémenter inscription e-mail/mot de passe, vérification d’e-mail, connexion/déconnexion, réinitialisation du mot de passe, profil et sessions; protéger contre force brute et limiter le débit.
- [ ] Permettre plusieurs projets par utilisateur/organisation, avec nom, description, application, type (Web/Mobile/API/E-commerce/autre), environnement Sandbox, statut, URL de webhook et fournisseurs activés.
- [ ] Isoler strictement les données par organisation et par projet.
- [ ] Générer des clés par projet (par exemple `pk_test_...` et `sk_test_...`), afficher le secret une seule fois, stocker les secrets hachés, autoriser révocation immédiate et rotation, permissions, date de création et dernière utilisation.

## Profils fournisseurs de simulation

- [ ] Fournir les profils `mtn_benin`, `moov_benin` et `celtiis_benin`, indiquant identifiant, nom commercial, pays, devise XOF, code opérateur, opérations simulées, contraintes de numéros de test, délais, scénarios et statuts.
- [ ] Modéliser les profils comme des paramètres de simulation documentés, jamais comme des règles officielles non vérifiées; ne pas coder la logique opérateur dans les contrôleurs publics.
- [ ] Prévoir l’extension à d’autres fournisseurs et des adaptateurs de production futurs sans prétendre qu’ils sont disponibles ou autorisés.

## Paiements, remboursements, idempotence et états

- [ ] Permettre création, consultation, annulation, remboursement total et remboursement partiel de paiements simulés.
- [ ] Garantir l’idempotence persistée par `Idempotency-Key` : même clé et même requête retourne le résultat existant sans doublon; même clé et charge utile différente retourne une erreur explicite.
- [ ] Implémenter les états `CREATED`, `PENDING`, `PROCESSING`, `SUCCESS`, `FAILED`, `EXPIRED`, `CANCELLED`, `REFUND_PENDING`, `PARTIALLY_REFUNDED` et `REFUNDED`.
- [ ] Contrôler les transitions permises : `CREATED → PENDING`; `PENDING → PROCESSING|SUCCESS|FAILED|EXPIRED|CANCELLED`; `PROCESSING → SUCCESS|FAILED`; `SUCCESS → REFUND_PENDING`; `REFUND_PENDING → REFUNDED`; interdire toute altération arbitraire d’état terminal.
- [ ] Enregistrer un `PaymentEvent` horodaté à chaque transition et créer l’événement durable/outbox dans la même transaction SQL avant traitement asynchrone.

## Moteur de simulation et téléphone virtuel

- [ ] Supporter les scénarios déterministes : paiement accepté/refusé, solde insuffisant, numéro invalide, numéro inconnu/non enregistré, expiration, abandon, attente, confirmation après délai/longue attente, timeout opérateur, erreur technique/réseau, indisponibilité fournisseur, échec de notification, remboursements total/partiel, double soumission et répétition avec clé d’idempotence.
- [ ] Donner la priorité aux scénarios déterministes pour les tests fonctionnels; réserver délais aléatoires/probabilités à des tests de résilience explicitement configurés.
- [ ] Contrôler les délais, expirations, probabilités d’erreur, notifications et indisponibilités temporaires dans la console ou l’outil d’administration.
- [ ] Fournir un vrai simulateur connecté au moteur : fournisseur, montant, numéro, marchand, demande de confirmation, clavier fictif, PIN fictif uniquement, confirmation/annulation et écrans USSD interactifs qui déclenchent réellement la transition et mettent à jour l’état.
- [ ] Ne jamais demander, traiter, enregistrer ou afficher un vrai PIN Mobile Money; afficher que la transaction est simulée et qu’aucun fonds n’est transféré.

## Webhooks, événements et inspection

- [ ] Gérer `payment.created`, `payment.pending`, `payment.processing`, `payment.success`, `payment.failed`, `payment.expired`, `payment.cancelled`, `refund.created`, `refund.success` et `refund.failed`.
- [ ] Configurer URL et secret de webhook chiffré; signer le corps exact avec HMAC-SHA256 et fournir un `event_id` stable.
- [ ] Envoyer de façon asynchrone avec réessais exponentiels plafonnés; historiser chaque tentative, inspecter payload/réponse HTTP et permettre le rejeu manuel depuis le dashboard.
- [ ] Protéger les requêtes sortantes contre SSRF (IP privées, locales et réservées, validation DNS et rebinding) et ne jamais mettre de secrets dans les logs.
- [ ] Permettre recherche de transactions par ID/référence marchand, filtres fournisseur/statut/date, détails de cycle de vie, événements, réponse simulée et journaux techniques.
- [ ] Fournir une console intégrée pour exécuter des requêtes API et consulter l’historique.

## Documentation et SDK

- [ ] Documenter démarrage, authentification, paiements, consultation, annulation, remboursements, webhooks, erreurs, exemples JavaScript/TypeScript, Python et PHP, collection Postman, référence des endpoints et essai interactif.
- [ ] Démontrer l’idempotence, les signatures de webhook et les profils comme simulations, avec exemples reproduisibles.

## Administration, audit et quotas

- [ ] Fournir une vue d’administration pour utilisateurs, organisations, projets, suspension, fournisseurs et scénarios simulés, quotas/limites, statistiques globales, erreurs/queues et journaux d’audit.
- [ ] Garantir que les administrateurs ne peuvent jamais voir les secrets d’API en clair et que les secrets n’apparaissent dans aucun log.

## Sécurité et isolation des données

- [ ] Exiger HTTPS pour un déploiement public; utiliser Argon2id pour mots de passe, limitation de débit, validation/contrôle d’accès strict par organisation/projet, requêtes paramétrées/ORM et chiffrement des secrets sensibles.
- [ ] Ajouter des tests couvrant les tentatives d’accès inter-organisation/projet et le fait que les secrets sont masqués.
- [ ] Préparer sauvegardes automatisées chiffrées et procédures de restauration côté VPS; ne pas prétendre qu’une sauvegarde managée Manus non disponible est exécutée.

## Adaptation Manus et cible VPS

- [ ] Faire fonctionner le projet géré Manus avec un schéma Prisma compatible MySQL et une API/UI accessibles dans le runtime géré; noter que cette base n’est pas PostgreSQL.
- [ ] Préparer des schémas et migrations Prisma distincts pour PostgreSQL VPS; documenter et vérifier export, conversion et validation avant migration réelle.
- [ ] Préparer Dockerfiles, Docker Compose VPS, PostgreSQL, Redis/BullMQ, worker, reverse proxy HTTPS, variables d’environnement, sauvegarde/restauration et instructions d’installation/maintenance/sécurité.
- [ ] Ne pas activer Redis managé sans décision explicite sur son coût; ne pas déployer sur un VPS sans accès/autorisation et ne pas activer d’intégration opérateur de production.
- [ ] Établir les tests unitaires, contrats API et intégration correspondant aux fonctions effectivement livrées; exécuter uniquement les tests disponibles et rapporter les limites.
