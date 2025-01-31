const validateHexColor = (color) => {
    if (color == null) return false;
    return /^#([0-9A-F]{3}|[0-9A-F]{6})$/i.test(color);
}

const validateDate = (date) => !isNaN(Date.parse(date));