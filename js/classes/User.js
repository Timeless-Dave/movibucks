/**
 * User class - manages user profile and private movie ratings
 */
export class User {
    #ratings = new Map(); // Private: movieId -> rating (1-5)

    constructor({ id, name, avatar } = {}) {
        this.id = id || `user_${Date.now()}`;
        this.name = name || 'Movie Fan';
        this.avatar = avatar || 'https://via.placeholder.com/32?text=U';
    }

    /**
     * Rate a movie (1-5 stars). Private #ratings stores the value.
     */
    rateMovie(movieId, rating) {
        const validRating = Math.max(1, Math.min(5, Math.round(Number(rating))));
        this.#ratings.set(movieId, validRating);
    }

    /**
     * Get user's rating for a movie. Returns null if not rated.
     */
    getRating(movieId) {
        return this.#ratings.has(movieId) ? this.#ratings.get(movieId) : null;
    }

    /**
     * Get all rated movie IDs
     */
    getRatedMovies() {
        return Array.from(this.#ratings.keys());
    }

    /**
     * Get ratings as plain object for persistence (exposes via controlled serialization)
     */
    getRatingsSnapshot() {
        return Object.fromEntries(this.#ratings);
    }

    /**
     * Restore ratings from saved state
     */
    loadRatings(ratingsObj) {
        if (ratingsObj && typeof ratingsObj === 'object') {
            this.#ratings = new Map(Object.entries(ratingsObj));
        }
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            avatar: this.avatar,
            ratings: this.getRatingsSnapshot(),
        };
    }
}
