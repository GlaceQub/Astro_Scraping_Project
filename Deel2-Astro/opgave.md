# Puppeteer - deel 2

## Opdracht

We maken verder gebruik van het begrip "End to end testing". We hebben tot hiertoe Puppeteer gebruikt om websites te openen en data hierop te gaan bekijken. Voor het vervolg maken we gebruik van Playwright. Om deze E2E testing tot een goed einde te brengen en te automatiseren, maken we gebruik van de CI/CD pipeline in GitHub Actions.

Voor deze opdracht gebruik je Puppeteer om data op te halen van een website en deze in je eigen (nieuwe) frontend te tonen. Voor onze frontend maken we gebruik van Astro.

### Astro project aanmaken

Begin met het aanmaken van een nieuw Astro project. Bekijk hiervoor de documentatie van [Astro](https://docs.astro.build/en/getting-started/).

Gebruik onderstaande configuratie:
- Projectnaam: `frontend`
- Include sample files
- TypeScript: Yes
- Strict TypeScript: Strict
- Install dependencies: Yes
- Initialize git repository: No

Run het astro project met `pnpm dev`. Bekijk de output en bijhorende code.

### Aanpassingen aan Astro project

#### Flowbite toevoegen

In de layout (`Layout.astro`) van het astro project gaan we enkele zaken aanpassen. Verwijder hier alle styling.

Voeg daarna FlowBite toe aan het project. Gebruik hiervoor [de documentatie](https://flowbite.com/docs/getting-started/astro/). 

Je mag hier gebruik maken van de CDN optie om het script in te laden.

#### Index pagina aanpassen

Pas de index pagina (`index.astro`) aan. Verwijder hier alle styling alsook alle inhoud in de `main` tag.

#### Importeren van de games

Voeg aan de map `src` een map `data` toe. Plaats hierin het bestand `steam-deals.json` dat de scraper genereert.

Importeer in de index pagina deze json. Je kan meer uitleg vinden [op deze pagina](https://stackoverflow.com/questions/76145490/what-is-the-correct-way-of-importing-local-json-file-to-another-file-using-astro).

#### Bouwen van de frontend

Bouw nu een frontend die volgende zaken bevat:
- Een lijst van alle games
  - Naam
  - Kortingspercentage of N/A indien geen korting
- Een filter om te filteren op naam
- Een slider om te filteren op kortingspercentage

Een voorbeeld (dat je eventueel mag nabouwen) vind je [hier](https://pit-graduaten.be/astro-build/).

Gebruik de documentatie van Flowbite om de frontend te bouwen.

Enkele bijkomende vereisten:
- Werk met components binnen Astro. Volgende componenten moeten gedefinieerd zijn:
- `GameList` - Lijst van alle games
- `SearchInput` - Input veld om te filteren op naam
- `DiscountRangeSlider` - Slider om te filteren op kortingspercentage

### Testen toevoegen

Voeg testen toe aan je frontend. Gebruik hiervoor [Playwright](https://docs.astro.build/en/guides/testing/#playwright)

Schrijf testen voor volgende zaken:
- De frontend bevat een lijst van games
- De frontend bevat een input veld om te filteren op naam
- De frontend toont de juiste games na het filteren via de slider
- De frontend toont de juiste games na het filteren via de zoekfunctie en de slider tegelijk

### Testen runnen in CI/CD

#### Build en test

Voeg een Github action workflow file toe aan je repository. Deze workflow moet volgende stappen bevatten. Gebruik volgend startpunt:

```yaml
name: Build, Test & Deploy
defaults:
  run:
    working-directory: frontend
on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]
jobs:
  build-and-test:
    timeout-minutes: 60
    name: "Build & Test"
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: lts/*
    - name: Install dependencies
      run: npm install -g pnpm && pnpm install
```

Voeg aan de job `build-and-test` volgende stappen toe:
1. Bouw de frontend
2. Maak een artifact aan van de frontend. Dit wil zeggen dat je alle code die Astro aanmaakt, moet opslaan in een zip bestand. Gebruik hiervoor de `actions/upload-artifact` action. De output vind je in de `dist` folder.
3. Run de Playwright testen
4. Maak een artifact van het playwright rapport dat gegenereerd wordt.

### Deployen naar Combell via CI/CD

#### Combell webhosting
Indien je nog geen webhosting hebt, kan je een gratis webhosting aanvragen bij Combell via je schoolaccount. Surf naar Academic Software en vraag een gratis (Linux) webhosting aan.

1. Maak in Combell een FTP account aan. Kies als gebruikersnaam 'ghaction@{jouwdomein}.be' en als wachtwoord een sterk wachtwoord. Zorg dat je dit niet verliest.
2. Maak een kleine wijziging aan je Astro project, zodat we dit kunnen deployen naar een subfolder op de webhosting:
   1. Voeg een `base` tag toe in `astro.config.mjs` met als waarde `/astro-build`.
   2. Voeg een `site` tag toe in `astro.config.mjs` met als waarde `https://{jouwdomein}.be/astro-build`.
   3. Open `playwright.config.ts` en verander de `url` van de `webServer` naar `http://localhost:4321/astro-build`.
   4. Pas je testen aan. `page.goto("/")` wordt `page.goto("/astro-build")`.
3. Test of je astro project nog steeds werkt door `pnpm dev` opnieuw uit te voeren. Je project zou nu bereikbaar moeten zijn via `http://localhost:4321/astro-build`.

#### Deployen naar online webhosting

Voeg aan de Github action workflow file een nieuwe job `deploy` toe die de frontend deployt naar Combell. Gebruik hiervoor deze [ftp upload action](https://github.com/SamKirkland/FTP-Deploy-Action/tree/v4.3.5/).

Deze job moet volgende stappen bevatten:
1. Download de artifact van de frontend en open het
2. Upload de inhoud van de frontend naar de FTP server van Combell

Om dit tot een goed einde te brengen, zal je enkele secrets moeten instellen in je repository. Ga hiervoor naar de repository settings en voeg volgende secrets toe:
- `FTP_SERVER` - De server van Combell. Dit is normaal `ftp.{jouwdomein}.be`.
- `FTP_USERNAME` - De gebruikersnaam van de FTP account. Dit is normaal `ghaction@{jouwdomein}.be`.
- `FTP_PASSWORD` - Het wachtwoord van de FTP account. Dit is het wachtwoord dat je hebt ingesteld bij het aanmaken van de FTP account.

Gebruik bovenstaande secrets in de Github action workflow file.
