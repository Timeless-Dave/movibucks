/**
 * Review class - represents a user's review of a movie
 * Uses private #rating field for the star rating (1-5)
 */
export class Review {
    #rating = 0; // Private: 1-5 stars

    constructor({ movieId, userId, text, rating, timestamp } = {}) {
        this.movieId = movieId || '';
        this.userId = userId || '';
        this.text = text || '';
        this.timestamp = timestamp || new Date().toISOString();
        if (rating !== undefined) {
            this.setRating(rating);
        }
    }

    /**
     * Set rating with validation (1-5)
     */
    setRating(value) {
        const num = Number(value);
        if (!isNaN(num)) {
            this.#rating = Math.max(1, Math.min(5, Math.round(num)));
        }
    }

    /**
     * Get the private rating value
     */
    getRating() {
        return this.#rating;
    }

    getDisplayHTML() {
        const stars = '★'.repeat(this.#rating) + '☆'.repeat(5 - this.#rating);
        const shortText = this.text.length > 100 ? this.text.substring(0, 100) + '...' : this.text;
        return `
            <div class="review-card">
                <span class="review-rating">${stars}</span>
                <p class="review-text">${shortText}</p>
                <span class="review-date">${new Date(this.timestamp).toLocaleDateString()}</span>
            </div>
        `;
    }

    toJSON() {
        return {
            movieId: this.movieId,
            userId: this.userId,
            text: this.text,
            rating: this.getRating(),
            timestamp: this.timestamp,
        };
    }
}
