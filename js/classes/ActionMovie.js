import { Movie } from './Movie.js';

/**
 * ActionMovie - extends Movie with action-specific display
 * Red accent, explosion icon, "Action" badge, bold title
 */
export class ActionMovie extends Movie {
    constructor(data = {}) {
        super({ ...data, genre: data.genre || 'Action' });
    }

    getGenreBadge() {
        return '<i class="fas fa-bomb"></i> Action';
    }

    getGenreDisplayStyle() {
        return 'movie-card--action';
    }

    getDisplayHTML(userRating = null) {
        const shortPlot = this.plot.length > 120 ? this.plot.substring(0, 120) + '...' : this.plot;
        const ratingDisplay = userRating ? userRating + '/5' : 'IMDB: ' + this.imdbRating;
        return `
            <div class="movie-list-item ${this.getGenreDisplayStyle()}" data-movie-id="${this.id}">
                <span class="genre-badge genre-badge--action">${this.getGenreBadge()}</span>
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
