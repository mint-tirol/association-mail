# Mail CLI

Used to send Wellcomme and Newsletter mails to assosiation members.

## Install

~~~ bash
npm install
~~~

Debug Mode: Copy .env.sample to  .env and change settings and variables in the file.


## Examples

Willkommen Email

~~~ bash
node index welcome -f "example\members.xlsx"
~~~

Einladung Jahreshauptversammlung

~~~ bash
node index mail -t 03_Jahreshauptversammlung.html --subject "Einladung Jahreshauptversammlung" -d "example\letter.docx" -f "example\members.xlsx"  -a -vv
~~~

Mitgliedsbeitrag

~~~ bash
node index mail -t 04_Rechnung.html --subject Mitgliedsbeitrag -d "example\letter.docx" -f "example\members.xlsx" -a  -vv -u 24
~~~

## Production

Copy .env.sample to  .env.production and change settings and variables in the file.

~~~ bash
$env:NODE_ENV="production";
~~~

## TODO 

### Implement Image Module Extenstions

https://github.com/evilc0des/docxtemplater-image-module-free