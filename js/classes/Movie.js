/**
 * Base Movie class - represents a movie in the library
 */
export class Movie {
    constructor({ id, title, year, poster, plot, genre, imdbRating } = {}) {
        this.id = id || `movie_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        this.title = title || 'Unknown';
        this.year = year || '';
        this.poster = poster || 'https://via.placeholder.com/270x200?text=No+Poster';
        this.plot = plot || 'No description available.';
        this.genre = genre || 'General';
        this.imdbRating = imdbRating || 'N/A';
    }

    /**
     * Returns HTML string for displaying the movie card
     * Subclasses override this for genre-specific layouts
     */
    getDisplayHTML(userRating = null) {
        const shortPlot = this.plot.length > 120 ? this.plot.substring(0, 120) + '...' : this.plot;
        const ratingDisplay = userRating ? userRating + '/5' : 'IMDB: ' + this.imdbRating;
        return `
            <div class="movie-list-item movie-card--default" data-movie-id="${this.id}">
                <img class="movie-list-item-image" src="${(this.poster || '').replace(/"/g, '&quot;')}" alt="${(this.title || '').replace(/"/g, '&quot;')}" loading="lazy" onerror="this.onerror=null;this.src='https://via.placeholder.com/270x200/1a1a1a/666?text=No+Poster';this.alt='Poster unavailable'">
                <span class="movie-list-item-title">${this.title} (${this.year})</span>
                <p class="movie-list-item-desc">${shortPlot}</p>
                <span class="movie-list-item-rating">${ratingDisplay}</span>
                <div class="rating-stars" data-movie-id="${this.id}"></div>
                <button type="button" class="movie-list-item-button">Watch</button>
            </div>
        `;
    }

    toJSON() {
        return {
            id: this.id,
            title: this.title,
            year: this.year,
            poster: this.poster,
            plot: this.plot,
            genre: this.genre,
            imdbRating: this.imdbRating,
        };
    }

    static fromJSON(data) {
        return new Movie(data);
    }
}
