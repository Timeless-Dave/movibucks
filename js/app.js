import { Movie } from './classes/Movie.js';
import { ActionMovie } from './classes/ActionMovie.js';
import { ComedyMovie } from './classes/ComedyMovie.js';
import { User } from './classes/User.js';
import { Review } from './classes/Review.js';
import { fetchMovie, searchMovies } from './services/OMDBService.js';
import { getOMDBKey } from './config.js';

const STORAGE_KEY = 'movibucks_data';

// IMDb ID -> YouTube trailer video ID (official trailers)
const TRAILER_MAP = {
    'tt1375666': 'YoHD9XEInc0',   // Inception
    'tt0109830': 'bLvqoHBptjg',   // Forrest Gump
    'tt0848228': 'eOrNdBpGMv8',   // The Avengers
    'tt0137523': 'Su9cwyhdQNg',   // Fight Club
    'tt0111161': '6hB3S9bIclE',   // The Shawshank Redemption
    'tt0816692': 'zSWdZVtXT7E',   // Interstellar
    'tt0133093': 'Yk8m0R0Hc4Y',   // The Matrix
    'tt0076759': 'vZ734NWnA2A',   // Star Wars
    'tt0120737': 'r5X-hFf6Bwo',   // Lord of the Rings
    'tt0068646': 'sY1S34973zA',   // The Godfather
    'tt0482571': 'J4Bv1eV6rts',   // The Prestige
    'tt0114369': 'znmZoVkCjpI',   // Se7en
    'tt0468569': 'EXeTwQWrcwY',   // The Dark Knight
};

function checkFileProtocol() {
    if (typeof window !== 'undefined' && window.location.protocol === 'file:') {
        document.body.innerHTML = '<div style="padding:40px;text-align:center;font-family:sans-serif;background:#1a1a1a;color:#fff;min-height:100vh"><h1>Movibucks</h1><p>This app must run from a local server (ES modules require it).</p><p>Run in terminal:</p><code style="background:#333;padding:10px;display:block;margin:20px auto;max-width:400px">npx serve . -l 3000</code><p>Then open <a href="http://localhost:3000" style="color:#46d369">http://localhost:3000</a></p></div>';
        return true;
    }
    return false;
}

function getItemWidth() {
    const w = window.innerWidth;
    if (w <= 400) return 140;
    if (w <= 600) return 160;
    if (w <= 768) return 200;
    return 270;
}
function getItemMargin() {
    const w = window.innerWidth;
    if (w <= 400) return 10;
    if (w <= 600) return 12;
    if (w <= 768) return 20;
    return 30;
}

// App state
let user = new User();
let moviesByGenre = {}; // { genreName: [Movie, ...] }
let allMovies = [];
let viewMode = 'home'; // 'home' | 'mylist'
let displayView = 'slider'; // 'slider' | 'grid' | 'all'
let genreFilter = null; // null = all, or genre name
let currentFeaturedMovie = null;

// DOM refs - resolved when init runs
let featuredEl, featuredTitleEl, featuredDesc, searchInput, searchBtn, movieListsEl, toggleContainer, loadingOverlay, toastEl;

// --- Mock data when no API key ---
function getMockMovies() {
    return [
        new ActionMovie({ id: 'tt1375666', title: 'Inception', year: '2010', poster: 'https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_SX300.jpg', plot: 'A thief who steals corporate secrets through the use of dream-sharing technology.', genre: 'Action, Sci-Fi, Thriller', imdbRating: '8.8' }),
        new ComedyMovie({ id: 'tt0109830', title: 'Forrest Gump', year: '1994', poster: 'https://m.media-amazon.com/images/M/MV5BNWIwODRlZTUtY2U3ZS00Yzg1LWJhNzYtMmZiYmEyNmU1NjMzXkEyXkFQI1BanBnXkFtZTgwMTQ4NjkxNjE@._V1_SX300.jpg', plot: 'The presidencies of Kennedy and Johnson, the Vietnam War, and more.', genre: 'Comedy, Drama, Romance', imdbRating: '8.8' }),
        new ActionMovie({ id: 'tt0848228', title: 'The Avengers', year: '2012', poster: 'https://m.media-amazon.com/images/M/MV5BNDYxNjQyMjAtNTdiOS00NGYwLWFmNTAtNThmYjU5ZGI2YTI1XkEyXkFQI1BanBnXkFtZTcwMTM0NTUxMw@@._V1_SX300.jpg', plot: 'Earth\'s mightiest heroes must come together to stop Loki.', genre: 'Action, Sci-Fi', imdbRating: '8.0' }),
        new ComedyMovie({ id: 'tt0137523', title: 'Fight Club', year: '1999', poster: 'https://m.media-amazon.com/images/M/MV5BNDIzNDU0YzEtYzE5NS00YTA5LTg2YzItMTkzZjc1ZTdmZGM0XkEyXkFQI1BanBnXkFtZTcwMDU5NjAyNA@@._V1_SX300.jpg', plot: 'An insomniac and a soap salesman form an underground fight club.', genre: 'Comedy, Drama', imdbRating: '8.8' }),
        new Movie({ id: 'tt0111161', title: 'The Shawshank Redemption', year: '1994', poster: 'https://m.media-amazon.com/images/M/MV5BNDE3ODcxYzMtY2YzZC00NmNkLWJiNDEtZDViZWM2MzIxZDYwXkEyXkFQI1BanBnXkFtZTcwMTIwNjAzNw@@._V1_SX300.jpg', plot: 'Two imprisoned men bond over a number of years.', genre: 'Drama', imdbRating: '9.3' }),
        new ActionMovie({ id: 'tt0816692', title: 'Interstellar', year: '2014', poster: 'https://m.media-amazon.com/images/M/MV5BZjdkOTU3MDktN2IxOS00OGEyLWFmMjktY2FiMmZkNWIyODZiXkEyXkFQI1BanBnXkFtZTgwMTI3MjM0NzE@._V1_SX300.jpg', plot: 'A team of explorers travel through a wormhole in space.', genre: 'Action, Drama, Sci-Fi', imdbRating: '8.6' }),
        new ActionMovie({ id: 'tt0133093', title: 'The Matrix', year: '1999', poster: 'https://m.media-amazon.com/images/M/MV5BNzQzOTk3OTAtNDQ0Zi00ZTVkLWI0MTEtMDllZjNkYzNjNTc4XkEyXkFQI1BanBnXkFtZTgwNjE5MTkxMTE@._V1_SX300.jpg', plot: 'A computer hacker learns about the true nature of reality.', genre: 'Action, Sci-Fi', imdbRating: '8.7' }),
        new ActionMovie({ id: 'tt0076759', title: 'Star Wars', year: '1977', poster: 'https://m.media-amazon.com/images/M/MV5BNzVlY2MwMjktM2E4OS00Y2Y3LWE3ZjctYzhkZGM3YzA1ZWM2XkEyXkFQI1BanBnXkFtZQIwMTM4MzYyNw@@._V1_SX300.jpg', plot: 'Luke Skywalker joins forces with Jedi to fight the Empire.', genre: 'Action, Adventure, Sci-Fi', imdbRating: '8.6' }),
        new Movie({ id: 'tt0120737', title: 'The Lord of the Rings', year: '2001', poster: 'https://m.media-amazon.com/images/M/MV5BN2EyZjM3NzUtNWUzMi00MTgxLWI0NTctMzY4M2VlOTdjZWRiXkEyXkFQI1BanBnXkFtZTcwNDg0MTUzNA@@._V1_SX300.jpg', plot: 'A meek hobbit must destroy a powerful ring.', genre: 'Adventure, Drama, Fantasy', imdbRating: '8.8' }),
        new Movie({ id: 'tt0068646', title: 'The Godfather', year: '1972', poster: 'https://m.media-amazon.com/images/M/MV5BM2MyNjYxNmUtYTAwNi00MTYxLWJmNWYtYjZlYWFlemNkNmNkXkEyXkFQI1BanBnXkFtZTAwNzk4MDI4._V1_SX300.jpg', plot: 'The aging patriarch of a crime family transfers control to his son.', genre: 'Crime, Drama', imdbRating: '9.2' }),
        new Movie({ id: 'tt0482571', title: 'The Prestige', year: '2006', poster: 'https://m.media-amazon.com/images/M/MV5BMjA4NDI0MTIxNF5BMl5BanBnXkFtZTYwNTM0MzY2._V1_SX300.jpg', plot: 'Two magicians engage in competitive one-upmanship.', genre: 'Drama, Mystery, Sci-Fi', imdbRating: '8.5' }),
        new Movie({ id: 'tt0114369', title: 'Se7en', year: '1995', poster: 'https://m.media-amazon.com/images/M/MV5BOTUwODM5MTctZjZjMi00ODFkLTg2YzctNzNjM2MzOTc2NWY0XkEyXkFQI1BanBnXkFtZTYwNDM3NDc2._V1_SX300.jpg', plot: 'Two detectives hunt a serial killer who uses the seven deadly sins.', genre: 'Crime, Drama, Mystery', imdbRating: '8.6' }),
        new ActionMovie({ id: 'tt0468569', title: 'The Dark Knight', year: '2008', poster: 'https://m.media-amazon.com/images/M/MV5BMTMxNTMwODM0NF5BMl5BanBnXkFtZTcwODAyMTk2Mw@@._V1_SX300.jpg', plot: 'Batman must accept one of the greatest tests to fight injustice.', genre: 'Action, Crime, Drama', imdbRating: '9.0' }),
        new ComedyMovie({ id: 'tt0114709', title: 'Toy Story', year: '1995', poster: 'https://m.media-amazon.com/images/M/MV5BMDU2ZWJlMjktMTRhMy00ZTA5LWEzNDgtYmNmZTEwZTViZWJkXkEyXkFQI1BanBnXkFtZTcwMTY4NDkxNw@@._V1_SX300.jpg', plot: 'A cowboy doll is threatened when a new spaceman figure arrives.', genre: 'Animation, Adventure, Comedy', imdbRating: '8.3' }),
        new ComedyMovie({ id: 'tt0120689', title: 'The Green Mile', year: '1999', poster: 'https://m.media-amazon.com/images/M/MV5BMTUxMzQyNjA5MF5BMl5BanBnXkFtZTYwOTU2NTY3._V1_SX300.jpg', plot: 'A death row guard witnesses supernatural events.', genre: 'Crime, Drama, Fantasy', imdbRating: '8.6' }),
        new Movie({ id: 'tt0099685', title: 'Goodfellas', year: '1990', poster: 'https://m.media-amazon.com/images/M/MV5BY2NkZjEzMDgtN2RjYy00YzM1LWI4ZmQtMjIwYjFmNTYWzHDFmXkEyXkFQI1BanBnXkFtZTgwNzkwNTIzMTE@._V1_SX300.jpg', plot: 'The story of Henry Hill and his life in the mob.', genre: 'Biography, Crime, Drama', imdbRating: '8.7' }),
        new ComedyMovie({ id: 'tt0095016', title: 'Die Hard', year: '1988', poster: 'https://m.media-amazon.com/images/M/MV5BZjRlNDUxZjAtOGQ4OC00OTNlLTgxNmQtYTBmMDgwZmNmNjkxXkEyXkFQI1BanBnXkFtZTcwNzkwNTIyNw@@._V1_SX300.jpg', plot: 'A New York cop battles terrorists in a LA skyscraper.', genre: 'Action, Thriller', imdbRating: '8.2' }),
        new Movie({ id: 'tt0102926', title: 'The Silence of the Lambs', year: '1991', poster: 'https://m.media-amazon.com/images/M/MV5BNjNhZTk0ZmEtNjJhMi00YzFlLGE1MmItYzM1M2ZmMGMwMTU4XkEyXkFQI1BanBnXkFtZTcwOTU4OTcz._V1_SX300.jpg', plot: 'A young FBI cadet must receive help from an incarcerated killer.', genre: 'Crime, Drama, Thriller', imdbRating: '8.6' }),
        new ComedyMovie({ id: 'tt0167260', title: 'The Lord of the Rings: The Return', year: '2003', poster: 'https://m.media-amazon.com/images/M/MV5BNzA5ZDNlZWMtM2NhNS00NDJjLTk4NDItYTRmY2EwMWZlMTY3XkEyXkFQI1BanBnXkFtZTAwMTM2Mzky._V1_SX300.jpg', plot: 'Frodo and Sam continue their journey to Mordor.', genre: 'Adventure, Drama, Fantasy', imdbRating: '8.9' }),
        new Movie({ id: 'tt0080684', title: 'The Empire Strikes Back', year: '1980', poster: 'https://m.media-amazon.com/images/M/MV5BYmU1NDRjNDgtMzhiMi00NjZmLTg5NGItZDNiNmUxNTQ1NGMxXkEyXkFQI1BanBnXkFtZTcwODM5MzIyNw@@._V1_SX300.jpg', plot: 'After the Rebels are brutally overpowered, Luke trains with Yoda.', genre: 'Action, Adventure, Fantasy', imdbRating: '8.7' }),
        new ActionMovie({ id: 'tt1345836', title: 'The Dark Knight Rises', year: '2012', poster: 'https://m.media-amazon.com/images/M/MV5BMTk4ODQzNDY3Ml5BMl5BanBnXkFtZTcwODA4NTMyOA@@._V1_SX300.jpg', plot: 'Eight years after Batman vanishes, a new terrorist leader overwhelms Gotham.', genre: 'Action, Crime, Drama', imdbRating: '8.4' }),
    ];
}

function groupMoviesByGenre(movies) {
    const grouped = {};
    for (const m of movies) {
        const genre = m.genre || 'General';
        const mainGenre = genre.split(',')[0].trim();
        if (!grouped[mainGenre]) grouped[mainGenre] = [];
        grouped[mainGenre].push(m);
    }
    return grouped;
}

function setFeatured(movie) {
    if (!movie) return;
    currentFeaturedMovie = movie;
    if (featuredEl) featuredEl.style.backgroundImage = `linear-gradient(to bottom, rgba(0,0,0,0.3), #323232), url('${(movie.poster || '').replace(/'/g, "\\'")}')`;
    if (featuredTitleEl) featuredTitleEl.textContent = `${movie.title || 'Unknown'} (${movie.year || ''})`;
    if (featuredDesc) featuredDesc.textContent = movie.plot || 'No description.';
}

function getDisplayMoviesByGenre() {
    if (viewMode === 'mylist') {
        let rated = allMovies.filter(m => user.getRatedMovies().includes(m.id));
        if (genreFilter) rated = rated.filter(m => (m.genre || '').toLowerCase().includes(genreFilter.toLowerCase()));
        return rated.length ? { 'My Rated': rated } : {};
    }
    if (genreFilter) {
        const filtered = moviesByGenre[genreFilter];
        return filtered ? { [genreFilter]: filtered } : {};
    }
    return moviesByGenre;
}

function getDisplayMoviesFlat() {
    if (viewMode === 'mylist') {
        let rated = allMovies.filter(m => user.getRatedMovies().includes(m.id));
        if (genreFilter) rated = rated.filter(m => (m.genre || '').toLowerCase().includes(genreFilter.toLowerCase()));
        return rated;
    }
    if (genreFilter) {
        return moviesByGenre[genreFilter] || [];
    }
    return allMovies;
}

function renderGenrePills() {
    const pillsEl = document.getElementById('genrePills');
    if (!pillsEl) return;
    const genres = Object.keys(moviesByGenre).sort();
    pillsEl.innerHTML = `<button type="button" class="genre-pill ${!genreFilter ? 'active' : ''}" data-genre="">All</button>` +
        genres.map(g => `<button type="button" class="genre-pill ${genreFilter === g ? 'active' : ''}" data-genre="${g}">${g}</button>`).join('');
    pillsEl.querySelectorAll('.genre-pill').forEach(btn => {
        btn.addEventListener('click', () => {
            genreFilter = btn.dataset.genre || null;
            document.querySelectorAll('.genre-pill').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderContent();
        });
    });
}

function renderViewToggle() {
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            displayView = btn.dataset.view;
            document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderContent();
        });
    });
}

function renderContent() {
    const galleryEl = document.getElementById('movieGallery');
    if (displayView === 'grid' || displayView === 'all') {
        movieListsEl.style.display = 'none';
        if (galleryEl) {
            galleryEl.style.display = 'grid';
            renderMovieGallery();
        }
    } else {
        movieListsEl.style.display = 'block';
        if (galleryEl) galleryEl.style.display = 'none';
        renderMovieLists();
    }
}

function renderMovieGallery() {
    const galleryEl = document.getElementById('movieGallery');
    if (!galleryEl) return;
    const movies = getDisplayMoviesFlat();
    galleryEl.innerHTML = '';
    if (movies.length === 0) {
        galleryEl.innerHTML = '<p class="no-movies">' + (viewMode === 'mylist' ? 'Rate some movies!' : 'No movies to display.') + '</p>';
        return;
    }
    galleryEl.className = 'movie-gallery ' + (displayView === 'all' ? 'gallery-large' : 'gallery-grid');
    galleryEl.innerHTML = movies.map(m => m.getDisplayHTML(user.getRating(m.id))).join('');
    attachRatingListeners();
    attachMovieCardListeners();
}

function renderMovieLists() {
    if (!movieListsEl) return;
    movieListsEl.innerHTML = '';
    const toRender = getDisplayMoviesByGenre();
    const genres = Object.keys(toRender).sort();

    if (genres.length === 0) {
        movieListsEl.innerHTML = '<p class="no-movies">' + (viewMode === 'mylist' ? 'Rate some movies to see them here!' : 'Add your API key and search, or use the mock data.') + '</p>';
        return;
    }

    genres.forEach((genre, idx) => {
        const container = document.createElement('div');
        container.className = 'movie-list-container';
        container.innerHTML = `
            <h2 class="movie-list-title">${genre}</h2>
            <div class="movie-list-wrapper">
                <i class="fas fa-chevron-left slider-arrow left" data-index="${idx}"></i>
                <i class="fas fa-chevron-right slider-arrow right" data-index="${idx}"></i>
                <div class="movie-list">
                    ${toRender[genre].map(m => m.getDisplayHTML(user.getRating(m.id))).join('')}
                </div>
            </div>
        `;
        movieListsEl.appendChild(container);
    });

    attachSliderListeners();
    attachRatingListeners();
    attachMovieCardListeners();
}

function attachSliderListeners() {
    const arrows = document.querySelectorAll('.slider-arrow');
    arrows.forEach(arrow => {
        arrow.addEventListener('click', () => {
            const idx = parseInt(arrow.dataset.index, 10);
            const wrapper = arrow.closest('.movie-list-wrapper');
            const list = wrapper.querySelector('.movie-list');
            const items = list.querySelectorAll('.movie-list-item');
            const itemW = getItemWidth();
            const itemM = getItemMargin();
            const visibleItems = Math.max(1, Math.floor(window.innerWidth / (itemW + itemM)));
            const maxScroll = Math.max(0, items.length - visibleItems);

            let tx = 0;
            const style = getComputedStyle(list);
            const transform = style.transform;
            if (transform && transform !== 'none') {
                const m = transform.match(/matrix\([^,]+,\s*[^,]+,\s*[^,]+,\s*[^,]+,\s*([^,]+)/);
                tx = m ? parseFloat(m[1]) : 0;
            }

            const step = (itemW + itemM) * Math.min(2, visibleItems);
            if (arrow.classList.contains('left')) {
                list.style.transform = `translateX(${Math.min(0, tx + step)}px)`;
            } else {
                list.style.transform = `translateX(${Math.max(-maxScroll * (itemW + itemM), tx - step)}px)`;
            }
        });
    });
}

function attachMovieCardListeners() {
    document.querySelectorAll('.movie-list-item').forEach(card => {
        const movieId = card.dataset.movieId;
        if (!movieId) return;
        const movie = allMovies.find(m => m.id === movieId);
        if (!movie) return;

        card.addEventListener('click', (e) => {
            if (e.target.closest('.rating-stars') || e.target.closest('.movie-list-item-button')) return;
            setFeatured(movie);
            showMoviePreview(movie);
        });

        const watchBtn = card.querySelector('.movie-list-item-button');
        if (watchBtn) {
            watchBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                showWatchPlayer(movie);
            });
        }
    });
}

function attachRatingListeners() {
    document.querySelectorAll('.rating-stars').forEach(container => {
        const movieId = container.dataset.movieId;
        if (!movieId) return;

        for (let i = 1; i <= 5; i++) {
            const star = document.createElement('i');
            star.className = 'fas fa-star';
            star.dataset.rating = i;
            star.title = `Rate ${i} stars`;
            container.appendChild(star);
        }

        const stars = container.querySelectorAll('i');
        const currentRating = user.getRating(movieId);

        const updateStars = (rating) => {
            stars.forEach((s, i) => s.classList.toggle('active', i < rating));
        };
        updateStars(currentRating || 0);

        stars.forEach(star => {
            star.addEventListener('click', (e) => {
                e.stopPropagation();
                const rating = parseInt(star.dataset.rating, 10);
                user.rateMovie(movieId, rating);
                saveState();
                updateStars(rating);
                const ratingSpan = container.closest('.movie-list-item')?.querySelector('.movie-list-item-rating');
                if (ratingSpan) ratingSpan.textContent = `${rating}/5`;
            });
        });
    });
}

function initDarkMode() {
    const darkEls = [document.body, document.querySelector('.container'), ...document.querySelectorAll('.movie-list-title'), document.querySelector('.navbar')];
    toggleContainer?.addEventListener('click', () => {
        toggleContainer.classList.toggle('active');
        const isDark = document.body.classList.contains('light-mode');
        document.body.classList.toggle('light-mode', !isDark);
        if (movieListsEl) {
            document.querySelectorAll('.movie-list-container').forEach(c => {
                c.classList.toggle('light-mode', !isDark);
            });
        }
        localStorage.setItem('movibucks_dark', isDark ? '1' : '0');
    });

    const saved = localStorage.getItem('movibucks_dark');
    if (saved === '0') {
        document.body.classList.add('light-mode');
        toggleContainer?.classList.add('active');
    }
}

function saveState() {
    const data = {
        user: user.toJSON(),
        movies: allMovies.map(m => m.toJSON()),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadState() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return false;
        const data = JSON.parse(raw);
        if (data.user) {
            user = new User(data.user);
            user.loadRatings(data.user.ratings);
        }
        if (data.movies && data.movies.length) {
            allMovies = data.movies.map(m => restoreMovie(m));
            moviesByGenre = groupMoviesByGenre(allMovies);
            return true;
        }
    } catch (e) {
        console.warn('Could not load saved state:', e);
    }
    return false;
}

function restoreMovie(json) {
    const g = (json.genre || '').toLowerCase();
    if (g.includes('action')) return new ActionMovie(json);
    if (g.includes('comedy')) return new ComedyMovie(json);
    return new Movie(json);
}

function showToast(msg, duration = 3000) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(window._toastTimer);
    window._toastTimer = setTimeout(() => toastEl.classList.remove('show'), duration);
}

function setLoading(show) {
    if (loadingOverlay) loadingOverlay.classList.toggle('visible', !!show);
}

async function handleSearch() {
    const query = searchInput?.value?.trim();
    if (!query) return;

    if (getOMDBKey()) {
        setLoading(true);
        try {
            const results = await searchMovies(query);
            if (results.length) {
                const existingIds = new Set(allMovies.map(m => m.id));
                const newOnes = results.filter(m => !existingIds.has(m.id));
                if (newOnes.length) {
                    allMovies.push(...newOnes);
                    moviesByGenre = groupMoviesByGenre(allMovies);
                    setFeatured(newOnes[0]);
                    renderGenrePills();
                    renderContent();
                    saveState();
                    showToast(`Added ${newOnes.length} movie(s)`);
                } else {
                    showToast('All results already in your library');
                }
                searchInput.value = '';
            } else {
                const single = await fetchMovie(query);
                if (single) {
                    const exists = allMovies.some(m => m.id === single.id);
                    if (!exists) {
                        allMovies.push(single);
                        moviesByGenre = groupMoviesByGenre(allMovies);
                        setFeatured(single);
                        renderGenrePills();
                    renderContent();
                        saveState();
                        showToast('Movie added!');
                    } else {
                        setFeatured(single);
                        showToast('Already in library');
                    }
                    searchInput.value = '';
                } else {
                    showToast('No results found. Try another search.');
                    searchInput.value = '';
                }
            }
        } finally {
            setLoading(false);
        }
        return;
    }

    allMovies = getMockMovies();
    moviesByGenre = groupMoviesByGenre(allMovies);
    setFeatured(allMovies[0]);
    renderGenrePills();
    renderContent();
    saveState();
    showToast('Using demo data. Add API key for real search!');
}

function showMoviePreview(movie) {
    const modal = document.getElementById('moviePreviewModal');
    const poster = document.getElementById('previewPoster');
    const title = document.getElementById('previewTitle');
    const meta = document.getElementById('previewMeta');
    const plot = document.getElementById('previewPlot');
    const rating = document.getElementById('previewRating');
    const watchBtn = document.getElementById('previewWatchBtn');
    const imdbLink = document.getElementById('previewImdbLink');
    if (!modal || !movie) return;
    const noPosterSvg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='330'%3E%3Crect fill='%231a1a1a' width='220' height='330'/%3E%3Ctext fill='%23666' x='110' y='165' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='14'%3ENo Poster%3C/text%3E%3C/svg%3E";
    if (poster) poster.src = movie.poster || noPosterSvg;
    if (title) title.textContent = `${movie.title || 'Unknown'} (${movie.year || ''})`;
    if (meta) meta.textContent = movie.genre || '';
    if (plot) plot.textContent = movie.plot || 'No description.';
    const userR = user.getRating(movie.id);
    if (rating) rating.textContent = userR ? `Your rating: ${userR}/5` : `IMDB: ${movie.imdbRating || 'N/A'}`;
    if (watchBtn) watchBtn.onclick = () => { closePreview(); showWatchPlayer(movie); };
    if (imdbLink && movie.id?.startsWith('tt')) {
        imdbLink.href = `https://www.imdb.com/title/${movie.id}/`;
        imdbLink.style.display = 'inline-block';
    } else if (imdbLink) {
        imdbLink.style.display = 'none';
    }
    const posterImg = modal?.querySelector('#previewPoster');
    if (posterImg) posterImg.onerror = function() { this.onerror=null; this.src=noPosterSvg; };
    modal.classList.add('open');
    const close = () => { closePreview(); document.removeEventListener('keydown', onEsc); };
    const onEsc = (e) => { if (e.key === 'Escape') close(); };
    modal.querySelector('.movie-preview-backdrop')?.addEventListener('click', close, { once: true });
    modal.querySelector('.movie-preview-close')?.addEventListener('click', close, { once: true });
    document.addEventListener('keydown', onEsc);
}

function closePreview() {
    document.getElementById('moviePreviewModal')?.classList.remove('open');
}

function getTrailerId(movie) {
    return (movie?.id && TRAILER_MAP[movie.id]) || null;
}

function showWatchPlayer(movie) {
    const modal = document.getElementById('watchPlayerModal');
    const videoEl = document.getElementById('watchPlayerVideo');
    const infoEl = document.getElementById('watchPlayerInfo');
    const actionsEl = document.getElementById('watchPlayerActions');
    if (!modal || !videoEl || !movie) return;
    const ytId = getTrailerId(movie);
    const imdbUrl = movie.id?.startsWith('tt') ? `https://www.imdb.com/title/${movie.id}/` : null;
    if (ytId) {
        videoEl.innerHTML = `<iframe src="https://www.youtube.com/embed/${ytId}?autoplay=1" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
    } else {
        videoEl.innerHTML = `<div class="no-trailer"><i class="fas fa-film"></i><p>Trailer embed not available</p><p class="no-trailer-hint">View full details on IMDb</p></div>`;
    }
    if (infoEl) infoEl.innerHTML = `<h3>${movie.title || 'Unknown'} (${movie.year || ''})</h3><p>${movie.plot || ''}</p>`;
    if (actionsEl) {
        actionsEl.innerHTML = imdbUrl
            ? `<a href="${imdbUrl}" target="_blank" rel="noopener" class="watch-imdb-btn"><i class="fa-brands fa-imdb"></i> View on IMDb</a><p class="watch-imdb-hint">Watch trailer, cast info, and streaming options</p>`
            : '';
    }
    modal.classList.add('open');
    const close = () => {
        modal.classList.remove('open');
        videoEl.innerHTML = '';
        document.removeEventListener('keydown', onEsc);
    };
    const onEsc = (e) => { if (e.key === 'Escape') close(); };
    modal.querySelector('.watch-player-backdrop')?.addEventListener('click', close, { once: true });
    modal.querySelector('.watch-player-close')?.addEventListener('click', close, { once: true });
    document.addEventListener('keydown', onEsc);
}

function closeWatchPlayer() {
    const modal = document.getElementById('watchPlayerModal');
    if (modal) {
        modal.classList.remove('open');
        const v = document.getElementById('watchPlayerVideo');
        if (v) v.innerHTML = '';
    }
}

function init() {
    if (checkFileProtocol()) return;
    featuredEl = document.getElementById('featured');
    featuredTitleEl = document.getElementById('featuredTitle');
    featuredDesc = document.getElementById('featuredDesc');
    searchInput = document.getElementById('searchInput');
    searchBtn = document.getElementById('searchBtn');
    movieListsEl = document.getElementById('movieLists');
    toggleContainer = document.querySelector('.toggle-container');
    loadingOverlay = document.getElementById('loadingOverlay');
    toastEl = document.getElementById('toast');

    if (!movieListsEl || !searchBtn) {
        console.error('Movibucks: Required DOM elements not found. Check index.html structure.');
        return;
    }

    loadState();

    if (allMovies.length === 0) {
        allMovies = getMockMovies();
        moviesByGenre = groupMoviesByGenre(allMovies);
        saveState();
    }
    setFeatured(allMovies[0] || null);

    renderGenrePills();
    renderViewToggle();
    renderContent();
    initDarkMode();
    initApiKeyPanel();
    initMenuItems();

    searchBtn?.addEventListener('click', handleSearch);
    searchInput?.addEventListener('keypress', e => e.key === 'Enter' && handleSearch());

    document.getElementById('featuredWatchBtn')?.addEventListener('click', () => {
        if (currentFeaturedMovie) showWatchPlayer(currentFeaturedMovie);
        else showToast('Select a movie first');
    });

    initSidebar();
}

function initApiKeyPanel() {
    const btn = document.getElementById('apiKeyBtn');
    const panel = document.getElementById('apiKeyPanel');
    const input = document.getElementById('apiKeyInput');
    const saveBtn = document.getElementById('apiKeySave');

    const stored = localStorage.getItem('movibucks_omdb_key');
    if (stored) input.placeholder = '••••••••••••';

    btn?.addEventListener('click', () => {
        panel?.classList.toggle('open');
    });
    saveBtn?.addEventListener('click', () => {
        const key = input?.value?.trim();
        if (key) {
            localStorage.setItem('movibucks_omdb_key', key);
            showToast('API key saved! Search now works with OMDB.');
            panel?.classList.remove('open');
            input.value = '';
            input.placeholder = '••••••••••••';
        } else {
            localStorage.removeItem('movibucks_omdb_key');
            showToast('API key cleared. Using mock data.');
        }
    });
}

function initSidebar() {
    document.querySelector('.sidebar-icon[title="Home"]')?.addEventListener('click', () => {
        viewMode = 'home';
        document.querySelector('.menu-item.active')?.classList.remove('active');
        document.querySelectorAll('.menu-item')[0]?.classList.add('active');
        renderContent();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    document.querySelector('.sidebar-icon[title="Search"]')?.addEventListener('click', () => {
        searchInput?.focus();
        document.getElementById('searchInput')?.scrollIntoView({ behavior: 'smooth' });
    });
    document.querySelector('.sidebar-icon[title="Library"]')?.addEventListener('click', () => {
        viewMode = 'mylist';
        document.querySelector('.menu-item.active')?.classList.remove('active');
        document.querySelectorAll('.menu-item')[1]?.classList.add('active');
        renderContent();
    });
}

function initMenuItems() {
    document.querySelectorAll('.menu-item').forEach((el, i) => {
        el.addEventListener('click', () => {
            document.querySelector('.menu-item.active')?.classList.remove('active');
            el.classList.add('active');
            if (i === 0) {
                viewMode = 'home';
                renderContent();
            }
            if (i === 1) {
                viewMode = 'mylist';
                renderContent();
            }
            if (i === 2) {
                viewMode = 'home';
                renderContent();
            }
        });
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
