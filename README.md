# Movibucks - OOP Movie Library App

An object-oriented movie library app for managing your movie collection. Built with vanilla JavaScript, featuring OMDB API integration and a Netflix-style UI.

## Features

- **OOP Design**: Movie, User, and Review classes with inheritance (ActionMovie, ComedyMovie)
- **Private Fields**: User ratings stored in private `#ratings` (User) and `#rating` (Review)
- **Genre-Specific Display**: Different badge and accent styles per genre
- **OMDB API**: Auto-fetch movie data (requires free API key)
- **Mock Data**: Works without API key using built-in sample movies
- **Netflix-Style UI**: Sliders, featured section, dark mode toggle
- **Responsive Design**: Mobile-friendly layout
- **localStorage Persistence**: Ratings and collection saved locally

## Quick Start

1. **Clone or download** the project
2. **Run a local server** (required for ES modules):
   ```bash
   npx serve .
   # or: python -m http.server 8000
   # or: Use VS Code "Live Server" extension
   ```
3. Open `http://localhost:3000` (or your server URL)

## OMDB API Setup (Optional)

1. Get a free API key: [omdbapi.com/apikey.aspx](https://www.omdbapi.com/apikey.aspx)
2. Open `js/config.js` and add your key:
   ```js
   export const OMDB_API_KEY = 'your_api_key_here';
   ```
3. Or set before loading: `window.MOVIBUCKS_OMDB_KEY = 'your_key';`

Without a key, the app uses mock data.

## Project Structure

```
movibucks/
├── index.html
├── css/style.css
├── js/
│   ├── classes/
│   │   ├── Movie.js        # Base class
│   │   ├── ActionMovie.js  # Extends Movie
│   │   ├── ComedyMovie.js  # Extends Movie
│   │   ├── User.js         # Private #ratings
│   │   └── Review.js       # Private #rating
│   ├── services/
│   │   └── OMDBService.js
│   ├── app.js
│   └── config.js
├── images/
└── README.md
```

## Usage

- **Search**: Type a movie title and click Search (or press Enter)
- **Rate**: Hover a movie card and click the star rating (1–5)
- **Sliders**: Use left/right arrows to scroll genre rows
- **Dark Mode**: Toggle the sun/moon switch in the navbar

## Assignment Checklist

- [x] Movie, User, Review classes
- [x] ActionMovie, ComedyMovie inheritance
- [x] Private fields for ratings
- [x] Different display methods per genre
- [x] OMDB API integration (with mock fallback)
- [x] Netflix-style UI with sliders and dark mode

**Submission**: Due 5pm Monday 16 Feb 2025
