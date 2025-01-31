export const validateHexColor = (color) => {
    if (color == null) return false;
    return /^#([0-9A-F]{3}|[0-9A-F]{6})$/i.test(color);
}

export const validateDate = (date) => {
    return !isNaN(Date.parse(date));
}