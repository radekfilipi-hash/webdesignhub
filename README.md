# WebDesignHub

Redesign webu agentury **[webdesignhub.cz](https://webdesignhub.cz)** — statický, tmavý moderní web.
Tvorba webů a e-shopů pro malé firmy a živnostníky.

## Spuštění lokálně

Nevyžaduje build ani závislosti — je to čistý statický web.

```bash
php -S localhost:8770 -t .
```

Pak otevři <http://localhost:8770>. (Případně jakýkoli jiný statický server, nebo XAMPP přes `localhost/webdesignhub`.)

## Struktura

| Soubor | Popis |
|---|---|
| `index.html` | Homepage (hero, služby, proces, ceník, reference, kontakt) |
| `assets/style.css` | Kompletní design — tmavé téma, gradienty, responsivita |
| `assets/main.js` | Animace: částicová síť reagující na myš, reveal při scrollu, počítadla, 3D naklápění karet |
| `assets/img/` | Obrázky — pozadí hero + screenshoty referencí |
| `varianty.html` | Pracovní pomůcka: porovnání variant pozadí hero |

## Technologie

Záměrně **bez frameworku a bez WordPressu** — statické HTML/CSS/JS kvůli rychlosti a SEO
(web agentury má být sám o sobě vizitkou výkonu).

- Fonty: Sora + Inter (Google Fonts)
- Tmavé téma, gradient fialová → purpurová → tyrkysová
- Plně responzivní, respektuje `prefers-reduced-motion`

## Stav a co zbývá

Hotový prototyp homepage. Dál je v plánu:

- [ ] Komprese obrázků referencí (PNG ~450–650 KB → WebP)
- [ ] Přidat **teduklizeno.cz** jako čtvrtou referenci
- [ ] Napojit kontaktní formulář na reálné odesílání (zatím jen demo potvrzení)
- [ ] Případné podstránky (Služby / Reference / Kontakt)

## Poznámky

- Fotky pozadí pocházejí z [Unsplash](https://unsplash.com) (volné použití).
- Reference jsou reálné screenshoty webů [thedropbs.cz](https://thedropbs.cz)
  a [ems-masaze-hlinsko.cz](https://ems-masaze-hlinsko.cz).
- Vlastní „smooth scroll" v JS byl záměrně odstraněn — nativní scroll je plynulejší.
