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
        const fallbackPoster = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='270' height='200'%3E%3Crect fill='%231a1a1a' width='270' height='200'/%3E%3Ctext fill='%23666' x='135' y='100' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='14'%3ENo Poster%3C/text%3E%3C/svg%3E";
        return `
            <div class="movie-list-item ${this.getGenreDisplayStyle()}" data-movie-id="${this.id}">
                <span class="genre-badge genre-badge--action">${this.getGenreBadge()}</span>
                <img class="movie-list-item-image" src="${(this.poster || fallbackPoster).replace(/"/g, '&quot;')}" alt="" loading="lazy" onerror="var f=this.getAttribute('data-fb');if(f){this.onerror=null;this.src=f;}" data-fb="${fallbackPoster.replace(/"/g, '&quot;')}">
                <span class="movie-list-item-title">${this.title} (${this.year})</span>
                <p class="movie-list-item-desc">${shortPlot}</p>
                <span class="movie-list-item-rating">${ratingDisplay}</span>
                <div class="rating-stars" data-movie-id="${this.id}"></div>
                <button type="button" class="movie-list-item-button">Watch</button>
            </div>
        `;
    }
}
