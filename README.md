# YouTube Playlist

Jednostavna staticka stranica za GitHub Pages.

## Pokretanje lokalno

Otvori `index.html` u browseru ili hostaj repozitorij preko GitHub Pages.

## GitHub Pages

Za GitHub Pages dovoljan je root folder repozitorija jer `index.html` vec postoji na vrhu projekta.

## Dodavanje pocetnih videa

Pocetni linkovi su u `defaultVideos` listi u fajlu `script.js`. Linkovi dodani kroz stranicu cuvaju se u browseru pomocu `localStorage`, pa ostaju zapamceni na tom uredjaju.

## Jezici

Defaultni jezik je bosanski. Dostupan je i holandski kroz izbor jezika na stranici. Novi tekstovi i prevodi dodaju se u `translations` objektu u fajlu `script.js`.

## Reset playliste

Klik na `Reset` trazi password. Trenutni password je `brisi` i definisan je u `RESET_PASSWORD` konstanti u fajlu `script.js`. Posto je stranica staticka, ovo je samo jednostavna client-side zastita.
