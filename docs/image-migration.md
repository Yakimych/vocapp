# Image migration report

Card images used to be links to third-party sites, so cards broke whenever a site removed an image. Images are now stored on Cloudinary ([#1](https://github.com/Yakimych/vocapp/issues/1), [#2](https://github.com/Yakimych/vocapp/pull/2)). This page records the result of migrating existing words, and lists the words that still use their old image URLs and how to fix each one.

_Status as of 2026-10-09._

## Result

`yarn migrate:images` ran against the production database on 2026-10-07.

| | Words |
|---|---:|
| Total | 1,086 |
| Without an image | 794 |
| With an image on a third-party site | 292 |
| Migrated to Cloudinary | 257 |
| **Not migrated** | **35** |

The 35 words that weren't migrated are unchanged and still point to their original URLs. The review page shows them as before: broken where the link is dead.

## How to fix a word

1. Find the word on the Words page and open its Edit page.
2. Replace the image: paste a working image URL, or save an image to your computer and use **Upload file**. To remove the image instead, clear the field.
3. Save. The server copies a pasted image to Cloudinary. An uploaded file goes there directly.

While the old URL is still in the image field, Save fails with "Couldn't copy image from …", even if you only changed something else. This happens because the server tries to copy the old image again. Replace or clear the image in the same edit.

To see which words are still left, run the migration as a dry run against the production database, following [Migrating existing images](../README.md#migrating-existing-images):

```
yarn migrate:images --dry-run
```

Running it without `--dry-run` retries only the words that are still left. That helps when a site was only temporarily unavailable.

## Words left to fix

### Paste a working URL (3)

These images still exist at a different URL. Paste that URL on the Edit page.

| Word | Working URL | Why the old URL failed |
|---|---|---|
| el rascacielos | <https://eluniverso-el-universo-prod.web.arc-cdn.net/resizer/v2/O3ORPITLY5FCJK2CVWQ6ZWJ2WU.jpg?auth=f9029263b4083baa6a87b3f35a4e58d9edce4fdc50f03e1cc1419f9965f5e7d0&width=609&height=670&smart=true&quality=70> | The old URL redirects, and the site refused Cloudinary (403). This is the redirect target. |
| la esfera | <https://upload.wikimedia.org/wikipedia/commons/7/7e/Sphere_wireframe_10deg_6r.svg> | Wikimedia rejects the old thumbnail URL (400). This is the original file. |
| el polo (sur) | <https://upload.wikimedia.org/wikipedia/commons/5/59/Pole-south.gif> | Wikimedia rejects the old thumbnail URL (400). This is the original file. |

### Try in a browser, then upload the file (6)

These sites block automated downloads, so the image may still exist. Open the old image in your browser. If it loads, save it and use **Upload file**. If it doesn't, find a new image.

| Word | Old image | Error |
|---|---|---|
| el arco | [old image](<https://w7.pngwing.com/pngs/213/591/png-transparent-goal-arco-football-sprite-football-game-angle-steel.png>) | 403 for Cloudinary, but it loads with a plain request |
| el inodoro | [old image](<https://pro.villeroy-boch.com/fileadmin/user_upload/Bad_und_Wellness/images/Innovationen/Universo_Twistflush/02_Mit_allen_Kollektionen.png>) | 403 |
| el ocio | [old image](<https://www.psicoactiva.com/wp-content/uploads/2016/07/ocio-salud-mental.jpg>) | 403 |
| la flota | [old image](<https://historia.nationalgeographic.com.es/medio/2012/10/18/77788633_2000x883.jpg>) | 403 |
| la tubería | [old image](<https://www.iagua.es/sites/default/files/images/tuberia-de-pvc.jpg>) | 429 Too Many Requests |
| los mariscos | [old image](<https://www.adelgar.es/wp-content/uploads/2016/11/marisco.png>) | 403 |

### Dead links: find a new image (26)

| Word | Old image | Error |
|---|---|---|
| agrio | [old image](<https://www.diferencias.cc/wp-content/uploads/2019/08/agrio-1.jpg>) | Domain no longer exists |
| disminuir | [old image](<https://www.ecured.cu/images/9/99/Disminuci%C3%B3n.jpg>) | 404 Not found |
| el agujero negro | [old image](<https://www.ngenespanol.com/wp-content/uploads/2022/09/agujero-negro.jpg>) | Returns a web page, not an image |
| el alquiler | [old image](<https://i0.wp.com/www.bufeteprolegue.com/wp-content/uploads/2019/09/190923-alquiler-pagar.jpg?fit=700%2C420&ssl=1>) | 404 Not found |
| el borde | [old image](<https://ankimono.com/cards/151111/images/edge.jpeg>) | Returns a web page, not an image |
| el despido | [old image](<https://i0.wp.com/www.bufeteprolegue.com/wp-content/uploads/2018/03/el-despido-disciplinario.jpg>) | 404 Not found |
| el fracaso | [old image](<https://www.danielcolombo.com/wp-content/uploads/2019/11/emociones-fracaso-hombre-depresion-blanco-y-negro-daniel-colombo.jpg>) | Returns a web page, not an image |
| el haz | [old image](<https://i0.wp.com/jeronimo-alayon.com.ve/wp-content/uploads/2021/07/Como-brizna-de-polvo-suspendida-en-el-haz-de-luz-e1628898651354.jpg>) | 404 Not found |
| el piso | [old image](<https://ankimono.com/cards/150706/images/floor.jpeg>) | Returns a web page, not an image |
| el porcentaje | [old image](<https://t1.uc.ltmcdn.com/es/posts/8/8/1/como_sacar_un_porcentaje_de_dos_cantidades_31188_600.jpg>) | 404 Not found |
| el talón | [old image](<https://t1.uc.ltmcdn.com/es/posts/2/4/0/por_que_me_duele_el_talon_descubre_las_razones_28042_orig.jpg>) | 404 Not found |
| guapetón | [old image](<https://media.licdn.com/dms/image/C4D03AQEiYvFAmfWWmA/profile-displayphoto-shrink_800_800/0/1605276147093?e=1684368000&v=beta&t=Ds1n06z2TS4qRikV48LkBDinRA3rrOz866OAh9Ilcf8>) | Expired LinkedIn link (403) |
| la aguja | [old image](<https://ankimono.com/cards/150708/images/needle.jpeg>) | Returns a web page, not an image |
| la carrera | [old image](<https://ankimono.com/cards/150705/images/race.jpeg>) | Returns a web page, not an image |
| la caza | [old image](<https://www.abogacia.es/wp-content/uploads/2020/12/Blog-caza.jpg>) | Returns a web page, not an image |
| la docena | [old image](<https://i0.wp.com/matematicascercanas.com/wp-content/uploads/2016/11/docenahuevos01.jpg>) | 404 Not found |
| la herramienta | [old image](<https://ankimono.com/cards/150709/images/tool.jpeg>) | Returns a web page, not an image |
| la jornada de trabajo | [old image](<https://etyalegal.com/wp-content/uploads/2021/08/dt.common.streams.StreamServer.jpg>) | Domain no longer exists |
| la medición | [old image](<https://i1.wp.com/www3.gobiernodecanarias.org/medusa/ecoblog/crodalf/files/2018/04/captura.jpg>) | 404 Not found |
| la natación | [old image](<https://contents.mediadecathlon.com/p1934611/k$ef0130e3fe1cec3a715ff298db25418e/1920x0/2824pt2212/5648xcr1694/default.jpg>) | 410 Gone |
| la propiedad | [old image](<https://buroinmobiliario.mx/wp-content/uploads/2021/09/propiedad.jpeg>) | 404 Not found |
| la raíz | [old image](<https://sites.google.com/site/miwebpersonalfmcp/_/rsrc/1467133057397/home/2---definicion-de-la-raiz/descarga%20%285%29.jpg>) | Returns a web page, not an image |
| lograr | [old image](<https://ankimono.com/cards/151103/images/achievement.jpeg>) | Returns a web page, not an image |
| sindicato | [old image](<https://www.ecured.cu/images/5/5b/Sindicato.jpg>) | 404 Not found |
| suelto | [old image](<https://i0.wp.com/wokii.com/wp-content/uploads/2020/06/pelo-suelto.jpg>) | 404 Not found |
| traer | [old image](<https://thumbs.dreamstime.com/b/female-waiter-bringing-order-to-visitors-country-restaurant-smiling-friendly-205742879.jpg>) | 404 Not found |
