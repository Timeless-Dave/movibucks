import { Movie } from './classes/Movie.js';
import { ActionMovie } from './classes/ActionMovie.js';
import { ComedyMovie } from './classes/ComedyMovie.js';
import { User } from './classes/User.js';
import { Review } from './classes/Review.js';
import { fetchMovie, searchMovies } from './services/OMDBService.js';
import { OMDB_API_KEY } from './config.js';

const STORAGE_KEY = 'movibucks_data';

function getItemWidth() {
    return window.innerWidth <= 600 ? 180 : 270;
}
function getItemMargin() {
    return window.innerWidth <= 600 ? 15 : 30;
}

// App state
let user = new User();
let moviesByGenre = {}; // { genreName: [Movie, ...] }
let allMovies = [];

// DOM refs
const featuredEl = document.getElementById('featured');
const featuredTitleEl = document.getElementById('featuredTitle');
const featuredDesc = document.getElementById('featuredDesc');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const movieListsEl = document.getElementById('movieLists');
const toggleContainer = document.querySelector('.toggle-container');
const toggleBall = document.querySelector('.toggle-ball');

// --- Mock data when no API key ---
function getMockMovies() {
    return [
        new ActionMovie({
            id: 'tt1375666',
            title: 'Inception',
            year: '2010',
            poster: 'https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_SX300.jpg',
            plot: 'A thief who steals corporate secrets through the use of dream-sharing technology.',
            genre: 'Action, Sci-Fi, Thriller',
            imdbRating: '8.8',
        }),
        new ComedyMovie({
            id: 'tt0109830',
            title: 'Forrest Gump',
            year: '1994',
            poster: 'https://m.media-amazon.com/images/M/MV5BNWIwODRlZTUtY2U3ZS00Yzg1LWJhNzYtMmZiYmEyNmU1NjMzXkEyXkFQI1BanBnXkFtZTgwMTQ4NjkxNjE@._V1_SX300.jpg',
            plot: 'The presidencies of Kennedy and Johnson, the Vietnam War, and more.',
            genre: 'Comedy, Drama, Romance',
            imdbRating: '8.8',
        }),
        new ActionMovie({
            id: 'tt0848228',
            title: 'The Avengers',
            year: '2012',
            poster: 'https://m.media-amazon.com/images/M/MV5BNDYxNjQyMjAtNTdiOS00NGYwLWFmNTAtNThmYjU5ZGI2YTI1XkEyXkFQI1BanBnXkFtZTcwMTM0NTUxMw@@._V1_SX300.jpg',
            plot: 'Earth\'s mightiest heroes must come together to stop Loki.',
            genre: 'Action, Sci-Fi',
            imdbRating: '8.0',
        }),
        new ComedyMovie({
            id: 'tt0137523',
            title: 'Fight Club',
            year: '1999',
            poster: 'https://m.media-amazon.com/images/M/MV5BNDIzNDU0YzEtYzE5NS00YTA5LTg2YzItMTkzZjc1ZTdmZGM0XkEyXkFQI1BanBnXkFtZTcwMDU5NjAyNA@@._V1_SX300.jpg',
            plot: 'An insomniac and a soap salesman form an underground fight club.',
            genre: 'Comedy, Drama',
            imdbRating: '8.8',
        }),
        new Movie({
            id: 'tt0111161',
            title: 'The Shawshank Redemption',
            year: '1994',
            poster: 'https://m.media-amazon.com/images/M/MV5BNDE3ODcxYzMtY2YzZC00NmNkLWJiNDEtZDViZWM2MzIxZDYwXkEyXkFQI1BanBnXkFtZTcwMTIwNjAzNw@@._V1_SX300.jpg',
            plot: 'Two imprisoned men bond over a number of years.',
            genre: 'Drama',
            imdbRating: '9.3',
        }),
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
    featuredEl.style.backgroundImage = `linear-gradient(to bottom, rgba(0,0,0,0.3), #323232), url('${movie.poster}')`;
    if (featuredTitleEl) featuredTitleEl.textContent = `${movie.title} (${movie.year})`;
    if (featuredDesc) featuredDesc.textContent = movie.plot;
}

function renderMovieLists() {
    movieListsEl.innerHTML = '';
    const genres = Object.keys(moviesByGenre).sort();

    if (genres.length === 0) {
        movieListsEl.innerHTML = '<p class="no-movies">Add your API key in js/config.js and search, or use the mock data.</p>';
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
                    ${moviesByGenre[genre].map(m => m.getDisplayHTML(user.getRating(m.id))).join('')}
                </div>
            </div>
        `;
        movieListsEl.appendChild(container);
    });

    attachSliderListeners();
    attachRatingListeners();
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

async function handleSearch() {
    const query = searchInput?.value?.trim();
    if (!query) return;

    if (OMDB_API_KEY) {
        const results = await searchMovies(query);
        if (results.length) {
            allMovies = [...allMovies, ...results];
            moviesByGenre = groupMoviesByGenre(allMovies);
            setFeatured(allMovies[0]);
            renderMovieLists();
            saveState();
            searchInput.value = '';
            return;
        }
        const single = await fetchMovie(query);
        if (single) {
            allMovies.push(single);
            moviesByGenre = groupMoviesByGenre(allMovies);
            setFeatured(single);
            renderMovieLists();
            saveState();
            searchInput.value = '';
            return;
        }
        movieListsEl.innerHTML = '<p class="no-movies">No results found. Try another search.</p>';
        searchInput.value = '';
        return;
    }

    allMovies = getMockMovies();
    moviesByGenre = groupMoviesByGenre(allMovies);
    setFeatured(allMovies[0]);
    renderMovieLists();
    saveState();
}

function init() {
    loadState();

    if (allMovies.length === 0) {
        allMovies = getMockMovies();
        moviesByGenre = groupMoviesByGenre(allMovies);
        setFeatured(allMovies[0]);
        saveState();
    }

    renderMovieLists();
    initDarkMode();

    searchBtn?.addEventListener('click', handleSearch);
    searchInput?.addEventListener('keypress', e => e.key === 'Enter' && handleSearch());
}

init();
