import { getOMDBKey } from '../config.js';
import { Movie } from '../classes/Movie.js';
import { ActionMovie } from '../classes/ActionMovie.js';
import { ComedyMovie } from '../classes/ComedyMovie.js';

const OMDB_BASE = 'https://www.omdbapi.com/';

/**
 * Map OMDB genre string to Movie subclass
 */
function createMovieFromOMDB(data) {
    const genre = (data.Genre || '').toLowerCase();
    const baseData = {
        id: data.imdbID,
        title: data.Title || 'Unknown',
        year: data.Year || '',
        poster: data.Poster && data.Poster !== 'N/A' ? String(data.Poster).replace(/^http:\/\//i, 'https://') : "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='270' height='200'%3E%3Crect fill='%231a1a1a' width='270' height='200'/%3E%3Ctext fill='%23666' x='135' y='100' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='14'%3ENo Poster%3C/text%3E%3C/svg%3E",
        plot: data.Plot || 'No description available.',
        genre: data.Genre || 'General',
        imdbRating: data.imdbRating || 'N/A',
    };

    if (genre.includes('action')) {
        return new ActionMovie(baseData);
    }
    if (genre.includes('comedy')) {
        return new ComedyMovie(baseData);
    }
    return new Movie(baseData);
}

/**
 * Fetch a single movie by title and optional year
 */
export async function fetchMovie(title, year = '') {
    const key = getOMDBKey();
    if (!key) return null;
    const params = new URLSearchParams({
        apikey: key,
        t: title.trim(),
        plot: 'short',
        r: 'json',
    });
    if (year) params.set('y', year);

    try {
        const res = await fetch(`${OMDB_BASE}?${params}`);
        const data = await res.json();
        if (data.Response === 'True') {
            return createMovieFromOMDB(data);
        }
        return null;
    } catch (err) {
        console.error('OMDB fetch error:', err);
        return null;
    }
}

/**
 * Search movies by title (returns array)
 */
export async function searchMovies(title, page = 1) {
    const key = getOMDBKey();
    if (!key) {
        return [];
    }
    const params = new URLSearchParams({
        apikey: key,
        s: title.trim(),
        page: String(page),
        r: 'json',
    });

    try {
        const res = await fetch(`${OMDB_BASE}?${params}`);
        const data = await res.json();
        if (data.Response === 'True' && data.Search && data.Search.length) {
            const movies = [];
            for (const item of data.Search) {
                const full = await fetchMovieById(item.imdbID);
                if (full) movies.push(full);
            }
            return movies;
        }
        return [];
    } catch (err) {
        console.error('OMDB search error:', err);
        return [];
    }
}

/**
 * Fetch movie by IMDB ID
 */
export async function fetchMovieById(imdbId) {
    const key = getOMDBKey();
    if (!key) return null;
    const params = new URLSearchParams({
        apikey: key,
        i: imdbId,
        plot: 'short',
        r: 'json',
    });
    try {
        const res = await fetch(`${OMDB_BASE}?${params}`);
        const data = await res.json();
        if (data.Response === 'True') {
            return createMovieFromOMDB(data);
        }
        return null;
    } catch (err) {
        console.error('OMDB fetch by ID error:', err);
        return null;
    }
}
