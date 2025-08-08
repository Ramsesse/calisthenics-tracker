# 🚀 Calisthenics Tracker - Deployment Instructions

## 📋 Complete Implementation Features

✅ **Base Test System**
- Automaticky sa zobrazí formulár ak nie sú žiadne data alebo sú staršie ako 2 mesiace
- Base test pre základné cviky: Push-ups, Pull-ups, Squats, Plank, Sit-ups, Burpees
- Výsledky sa ukladajú do BaseTest tabuľky

✅ **Progressions Integration** 
- Automatické predvyplnenie očakávaných répov na základe base testu a aktuálneho levelu
- Progresný algoritmus: každý level +20% répov
- Sekcia Progress pre sledovanie pokroku a level up

✅ **Dynamic UI**
- 4 sekcie: Workout, History, Progress, Equipment
- Kompletne dynamické načítavanie obsahu
- Base test form sa zobrazí ak je potrebný

✅ **Google Sheets Integration**
- Všetkých 7 tabuliek načítaných a používaných
- Ukladanie do UserHistory, BaseTest, Progressions
- CORS podpora pre GitHub Pages

## 🔧 Google Apps Script Setup (CRITICAL!)

Pre funkčnosť na GitHub Pages je potrebné správne nastaviť CORS v Google Apps Script:

### 1. Apps Script Code:
```javascript
function doOptions() {
  return ContentService
    .createTextOutput()
    .setMimeType(ContentService.MimeType.TEXT)
    .getBlob()
    .setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
}

function doGet(e) {
  const sheet = e.parameter.sheet;
  if (!sheet) return ContentService.createTextOutput('Missing sheet parameter');
  
  const response = ContentService.createTextOutput()
    .setMimeType(ContentService.MimeType.JSON)
    .setContent(JSON.stringify(getSheetData(sheet)));
    
  response.setHeaders({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  
  return response;
}

function doPost(e) {
  const sheet = e.parameter.sheet;
  const data = JSON.parse(e.postData.contents);
  
  // Save data to appropriate sheet
  const result = saveToSheet(sheet, data);
  
  const response = ContentService.createTextOutput()
    .setMimeType(ContentService.MimeType.JSON)
    .setContent(JSON.stringify({success: result}));
    
  response.setHeaders({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  
  return response;
}
```

### 2. Deployment:
1. V Apps Script ide na **Deploy** → **New Deployment**
2. Type: **Web app**
3. Execute as: **Me**
4. Who has access: **Anyone**
5. **Deploy** a skopíruj URL

### 3. Update API URL:
Aktualizuj URL v `app.js` na riadku 2:
```javascript
const apiUrl = "YOUR_NEW_APPS_SCRIPT_URL_HERE";
```

## 🌐 GitHub Pages URL

Aplikácia bude dostupná na:
**https://ramsesse.github.io/calisthenics-tracker/**

Test API pripojenia:
**https://ramsesse.github.io/calisthenics-tracker/api-test.html**

## 📊 Database Tables Used

1. **TrainingPlans** - Tréningové plány
2. **TrainingPlanExercises** - Cviky pre každý plán/deň  
3. **UserHistory** - História tréningov
4. **Equipment** - Vybavenie
5. **Users** - Používatelia
6. **Progressions** - Pokrok používateľov
7. **BaseTest** - Základné testy

## 🎯 User Experience

1. **Prvé spustenie**: Base test formulár
2. **Po base teste**: Hlavná aplikácia s predvyplnenými hodnotami
3. **Progress tracking**: Automatické navrhovanie répov na základe levelu
4. **History**: Týždenná história tréningov
5. **Equipment**: Zoznam dostupného vybavenia

## 🔍 Troubleshooting

- Ak API nefunguje, skontroluj CORS nastavenia v Apps Script
- Použij `api-test.html` na testovanie pripojenia
- Skontroluj Console v Developer Tools pre chyby

## 📱 PWA Features

- Service Worker pre offline funkcionalnost
- Manifest.json pre inštaláciu ako aplikácia
- Mobile-responsive design
