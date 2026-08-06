export function escapeHTML(value) {
    if (!value) return '';

    return String(value).replace(
        /[&<>'"]/g,
        character => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[character] || character)
    );
}

export function getElement(id) {
    return document.getElementById(id);
}
