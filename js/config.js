// OMDB API key - get free key at https://www.omdbapi.com/apikey.aspx
// Sources: localStorage 'movibucks_omdb_key' | default key | window.MOVIBUCKS_OMDB_KEY | ''
export function getOMDBKey() {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('movibucks_omdb_key') ||
        'df78ddad' ||
        (window.MOVIBUCKS_OMDB_KEY || '');
}
