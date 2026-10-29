"""Validate localized page links, metadata, assets and language coverage."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse,unquote
import json,xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1]
ORIGIN='https://www.beautifulclockradio.com'
class Page(HTMLParser):
 def __init__(self):
  super().__init__();self.lang=None;self.h1=0;self.canonical=[];self.alternates={};self.links=[];self.raw=None;self.json=False;self.text='';self.json_count=0;self.imgs=[]
 def handle_starttag(self,t,attrs):
  a=dict(attrs)
  if t=='html':self.lang=a['lang']
  if t=='h1':self.h1+=1
  if t=='link' and a.get('rel')=='canonical':self.canonical.append(a['href'])
  if t=='link' and a.get('rel')=='alternate':self.alternates[a['hreflang']]=a['href']
  if t in ['img','script','a','link']:
   u=a.get('src') or a.get('href')
   if u:self.links.append(u)
  if t=='img':self.imgs.append(a)
  if 'srcset' in a:self.links.extend(x.strip().split()[0] for x in a['srcset'].split(','))
  if t=='script':self.raw=t;self.json=a.get('type')=='application/ld+json'
 def handle_endtag(self,t):
  if t==self.raw:self.raw=None;self.json=False
 def handle_data(self,d):
  if self.json:json.loads(d);self.json_count+=1
  elif not self.raw:self.text+=d
for lang,relative in [('en','index.html'),('fr','fr/index.html'),('de','de/index.html'),('es','es/index.html')]:
 p=ROOT/relative;s=p.read_text();c=Page();c.feed(s)
 url=ORIGIN+('/' if lang=='en' else '/'+lang+'/')
 assert c.lang==lang and c.h1==1 and c.canonical==[url] and c.json_count==1
 assert c.alternates=={'en':ORIGIN+'/','fr':ORIGIN+'/fr/','de':ORIGIN+'/de/','es':ORIGIN+'/es/','x-default':ORIGIN+'/'}
 for u in c.links:
  parts=urlparse(u)
  if parts.scheme or not parts.path:continue
  resolved=(ROOT/parts.path.lstrip('/')) if parts.path.startswith('/') else (p.parent/unquote(parts.path))
  assert resolved.exists(),(p,u)
 if lang!='en':
  assert 'Pause slideshow' not in c.text and 'Skip to content' not in c.text
  assert f'../assets/{lang}/best-devices.png' in s
  assert all(f'../assets/{lang}/iphone-{n}.png' in s for n in [2,3,4])
  assert 'data-pause-label' in s and 'data-play-label' in s
 print(relative+': language, canonical, alternates, schema, assets and links OK')
ET.parse(ROOT/'sitemap.xml')
