"""Build crawlable French/German homepages from the English page and translation files.
Run from any directory: python3 tools/build-localized-pages.py
"""
from html import escape
from html.parser import HTMLParser
from pathlib import Path
import json,re
ROOT=Path(__file__).resolve().parents[1]
ORIGIN='https://www.beautifulclockradio.com'
URLS={'en':ORIGIN+'/', 'fr':ORIGIN+'/fr/', 'de':ORIGIN+'/de/'}
LABELS={'en':'English','fr':'Français','de':'Deutsch'}
ATTRS={
 'fr':{
 'Main navigation':'Navigation principale','Download our apps':'Télécharger nos apps',
 'Our apps on iPad and iPhone':'Nos apps sur iPad et iPhone','carousel':'carrousel',
 'Best Clock Radio app icon':'Icône de Best Clock Radio','Beautiful Clock Radio app icon':'Icône de Beautiful Clock Radio',
 'Download Best Clock Radio on the App Store':'Télécharger Best Clock Radio sur l’App Store',
 'Download Beautiful Clock Radio on the App Store':'Télécharger Beautiful Clock Radio sur l’App Store',
 'Download on the App Store':'Télécharger dans l’App Store',
 'Best Clock Radio on iPad and iPhone, showing the clock, weather, and programmable station buttons':'Best Clock Radio sur iPad et iPhone : horloge, météo et boutons de stations programmables',
 'Beautiful Clock Radio on iPad and iPhone with a photographic harbor background':'Beautiful Clock Radio sur iPad et iPhone avec un fond photographique de port',
 'Best Clock Radio App Demo Video':'Vidéo de présentation de Best Clock Radio (en anglais)',
 'Alarm icon':'Icône d’alarme','Music note icon':'Icône de note de musique','Play button icon':'Icône de lecture','Email arrow icon':'Flèche du lien de messagerie',
 'Best Clock Radio alarm settings on iPhone':'Réglages d’alarme de Best Clock Radio sur iPhone',
 'Best Clock Radio alarm sound settings on iPhone':'Choix du son d’alarme dans Best Clock Radio sur iPhone',
 'Best Clock Radio podcast player interface on iPhone':'Lecteur de podcasts de Best Clock Radio sur iPhone',
 'Beautiful Clock Radio on iPad displaying a photographic harbor background at sunset':'Beautiful Clock Radio sur iPad avec une photographie de port au coucher du soleil',
 'Beautiful Clock Radio on iPhone with six programmable favorites over a sunflower background':'Beautiful Clock Radio sur iPhone avec six favoris programmables sur un fond de tournesols',
 'Radio, podcast, and music symbols beside a winding coastal road at sunset':'Symboles de radio, de podcast et de musique près d’une route côtière au coucher du soleil',
 'Best Clock Radio customer support illustration':'Illustration de l’assistance Best Clock Radio',
 },
 'de':{
 'Main navigation':'Hauptnavigation','Download our apps':'Unsere Apps herunterladen',
 'Our apps on iPad and iPhone':'Unsere Apps auf iPad und iPhone','carousel':'Karussell',
 'Best Clock Radio app icon':'App-Symbol von Best Clock Radio','Beautiful Clock Radio app icon':'App-Symbol von Beautiful Clock Radio',
 'Download Best Clock Radio on the App Store':'Best Clock Radio im App Store herunterladen',
 'Download Beautiful Clock Radio on the App Store':'Beautiful Clock Radio im App Store herunterladen',
 'Download on the App Store':'Im App Store laden',
 'Best Clock Radio on iPad and iPhone, showing the clock, weather, and programmable station buttons':'Best Clock Radio auf iPad und iPhone mit Uhr, Wetter und frei belegbaren Sendertasten',
 'Beautiful Clock Radio on iPad and iPhone with a photographic harbor background':'Beautiful Clock Radio auf iPad und iPhone mit einem Hafenfoto als Hintergrund',
 'Best Clock Radio App Demo Video':'Best Clock Radio im Video (Englisch)',
 'Alarm icon':'Weckersymbol','Music note icon':'Notensymbol','Play button icon':'Wiedergabesymbol','Email arrow icon':'Pfeilsymbol für E-Mail',
 'Best Clock Radio alarm settings on iPhone':'Weckereinstellungen von Best Clock Radio auf dem iPhone',
 'Best Clock Radio alarm sound settings on iPhone':'Wecktonauswahl in Best Clock Radio auf dem iPhone',
 'Best Clock Radio podcast player interface on iPhone':'Podcast-Player von Best Clock Radio auf dem iPhone',
 'Beautiful Clock Radio on iPad displaying a photographic harbor background at sunset':'Beautiful Clock Radio auf dem iPad mit einem Hafenfoto bei Sonnenuntergang',
 'Beautiful Clock Radio on iPhone with six programmable favorites over a sunflower background':'Beautiful Clock Radio auf dem iPhone mit sechs frei belegbaren Favoriten vor Sonnenblumen',
 'Radio, podcast, and music symbols beside a winding coastal road at sunset':'Symbole für Radio, Podcasts und Musik neben einer Küstenstraße bei Sonnenuntergang',
 'Best Clock Radio customer support illustration':'Illustration zum Best Clock Radio-Support',
 }}
DESCRIPTIONS={
 'fr':'Radio, podcasts et Apple Music avec favoris programmables, alarmes et minuterie de sommeil. Découvrez Best Clock Radio et Beautiful Clock Radio pour iPhone et iPad.',
 'de':'Radio, Podcasts und Apple Music mit frei belegbaren Favoriten, Weckern und Einschlaftimer. Best Clock Radio und Beautiful Clock Radio für iPhone und iPad.'}
def alternates():
 return '\n'.join(f'<link rel="alternate" hreflang="{lang}" href="{url}">' for lang,url in {**URLS,'x-default':URLS['en']}.items())
def switcher(lang):
 aria={'en':'Language','fr':'Langue','de':'Sprache'}[lang]
 return '<!-- language-switcher --><nav class="language-switcher" aria-label="'+aria+'">'+''.join(f'<a href="{url}" lang="{code}" hreflang="{code}"'+(' aria-current="page"' if code==lang else '')+'>'+LABELS[code]+'</a>' for code,url in URLS.items())+'</nav><!-- /language-switcher -->'
class Localize(HTMLParser):
 def __init__(self,lang,mapping):
  super().__init__(convert_charrefs=True);self.lang=lang;self.mapping=mapping;self.parts=[];self.raw=None;self.json_script=False;self.missing=set()
 def start(self,tag,attrs,end=False):
  a=dict(attrs)
  if tag in ['script','style']:self.raw=tag;self.json_script=a.get('type')=='application/ld+json'
  if tag=='html':a['lang']=self.lang
  if tag=='meta':
   kind=a.get('name') or a.get('property')
   if kind in ['description','og:description','twitter:description']:a['content']=DESCRIPTIONS[self.lang]
   if kind=='og:url':a['content']=URLS[self.lang]
   if kind in ['og:title','twitter:title']:a['content']=self.mapping['Best Clock Radio & Beautiful Clock Radio | iPhone & iPad']
  if tag=='link' and a.get('rel')=='canonical':a['href']=URLS[self.lang]
  for key in ['alt','title','aria-label','aria-roledescription']:
   if key in a and a[key]:
    if a[key] not in ATTRS[self.lang]:self.missing.add(a[key])
    a[key]=ATTRS[self.lang].get(a[key],a[key])
  for key in ['src','href']:
   if key not in a or not a[key]:continue
   v=a[key]
   if v=='./':v=URLS[self.lang]
   elif not v.startswith(('http','mailto:','#','data:','/')):v='../'+v
   a[key]=v
  if 'srcset' in a:a['srcset']=a['srcset'].replace('assets/','../assets/')
  if tag=='a' and a.get('href')=='../stations.html':a['href']+='?lang='+self.lang
  if tag=='img':
   v=a.get('src','')
   if 'best-clock-radio-ipad-iphone' in v:
    a['src']=f'../assets/{self.lang}/best-devices.png';a['srcset']=f'../assets/{self.lang}/best-devices-small.png 700w, ../assets/{self.lang}/best-devices.png 1400w'
   for n,part in [(2,'2 iphone Podcast.png'),(3,'3 iphone Alarm.png'),(4,'4 iphone Alarm Sound.png')]:
    if part in v:a['src']=f'../assets/{self.lang}/iphone-{n}.png'
   if v=='../assets/app-store.png':a['src']=f'../assets/{self.lang}/app-store.svg'
  if tag=='button' and a.get('id')=='hero-slide-pause':
   a['data-play-label']={'fr':'Lancer le diaporama','de':'Diashow starten'}[self.lang]
   a['data-pause-label']=self.mapping['Pause slideshow']
  # Tailwind's arbitrary background URL must resolve relative to the localized page.
  if 'class' in a:a['class']=a['class'].replace("'./assets/","'../assets/")
  self.parts.append('<'+tag+''.join(' '+k if v is None else ' '+k+'="'+escape(v,quote=True)+'"' for k,v in a.items())+(' />' if end else '>'))
 def handle_starttag(self,t,a):self.start(t,a)
 def handle_startendtag(self,t,a):self.start(t,a,True)
 def handle_endtag(self,t):
  self.parts.append('</'+t+'>')
  if t==self.raw:self.raw=None;self.json_script=False
 def handle_data(self,d):
  if self.raw:
   if self.json_script:
    data=json.loads(d)
    for node in data.get('@graph',[]):
     if node.get('@type')=='MobileApplication':
      node['description']=DESCRIPTIONS[self.lang]
      node['offers']['description']=self.mapping['Optional in-app purchases.']
    data['@graph'].append({'@type':'WebPage','url':URLS[self.lang],'inLanguage':self.lang,'name':self.mapping['Best Clock Radio & Beautiful Clock Radio | iPhone & iPad']})
    d=json.dumps(data,ensure_ascii=False,indent=2)
   self.parts.append(d);return
  normalized=' '.join(d.split())
  if not normalized:self.parts.append(d);return
  if normalized not in self.mapping:self.missing.add(normalized)
  leading=d[:len(d)-len(d.lstrip())];trailing=d[len(d.rstrip()):]
  self.parts.append(leading+escape(self.mapping.get(normalized,normalized))+trailing)
 def handle_decl(self,d):self.parts.append('<!'+d+'>')
 def handle_comment(self,d):self.parts.append('<!--'+d+'-->')
source=(ROOT/'index.html').read_text()
source=re.sub(r'\s*<!-- language-alternates -->.*?<!-- /language-alternates -->','',source,flags=re.S)
source=re.sub(r'\s*<!-- language-switcher -->.*?<!-- /language-switcher -->','',source,flags=re.S)
# Parse translations before adding language navigation so all displayed copy is checked.
for lang in ['fr','de']:
 mapping=json.loads((ROOT/f'translations/home-{lang}.json').read_text())
 parser=Localize(lang,mapping);parser.feed(source)
 if parser.missing:raise ValueError(f'Missing {lang} translations: {sorted(parser.missing)}')
 out=''.join(parser.parts)
 out=out.replace('</head>','<!-- language-alternates -->\n'+alternates()+'\n<!-- /language-alternates -->\n</head>')
 out=out.replace('</header>',switcher(lang)+'\n</header>',1)
 out=out.replace('<meta property="og:type" content="website" />',f'<meta property="og:type" content="website" /><meta property="og:locale" content="{lang}_{"FR" if lang=="fr" else "DE"}" />')
 directory=ROOT/lang;directory.mkdir(exist_ok=True);(directory/'index.html').write_text(out)
source=source.replace('</head>','<!-- language-alternates -->\n'+alternates()+'\n<!-- /language-alternates -->\n</head>')
source=source.replace('</header>',switcher('en')+'\n</header>',1)
(ROOT/'index.html').write_text(source)
# The sitemap uses the same canonical URLs as the pages.
p=ROOT/'sitemap.xml';s=p.read_text()
for lang in ['fr','de']:
 if URLS[lang] not in s:s=s.replace('</urlset>',f'  <url><loc>{URLS[lang]}</loc></url>\n</urlset>')
p.write_text(s)
print('Built /fr/ and /de/ with complete text/attribute translations and reciprocal language links.')
