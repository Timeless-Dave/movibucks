import { Movie } from './Movie.js';

/**
 * ComedyMovie - extends Movie with comedy-specific display
 * Yellow accent, laugh icon, "Comedy" badge
 */
export class ComedyMovie extends Movie {
    constructor(data = {}) {
        super({ ...data, genre: data.genre || 'Comedy' });
    }

    getGenreBadge() {
        return '<i class="fas fa-face-laugh"></i> Comedy';
    }

    getGenreDisplayStyle() {
        return 'movie-card--comedy';
    }

    getDisplayHTML(userRating = null) {
        const shortPlot = this.plot.length > 120 ? this.plot.substring(0, 120) + '...' : this.plot;
        const ratingDisplay = userRating ? `${userRating}/5` : `IMDB: ${this.imdbRating}`;
        return `
            <div class="movie-list-item ${this.getGenreDisplayStyle()}" data-movie-id="${this.id}">
                <span class="genre-badge genre-badge--comedy">${this.getGenreBadge()}</span>
                <img class="movie-list-item-image" src="${this.poster}" alt="${this.title}" loading="lazy">
                <span class="movie-list-item-title">${this.title} (${this.year})</span>
                <p class="movie-list-item-desc">${shortPlot}</p>
                <span class="movie-list-item-rating">${ratingDisplay}</span>
                <div class="rating-stars" data-movie-id="${this.id}"></div>
                <button class="movie-list-item-button">Watch</button>
            </div>
        `;
    }
}
