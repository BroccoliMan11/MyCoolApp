module.exports = {
    iff: (a, operator, b, options) => {
        let bool = false;
        switch (operator) {
            case '==': bool = (a == b); break;
            case '===': bool = (a === b); break;
            case '!=': bool = (a != b); break;
            case '!==': bool = (a !== b); break;
            case '>': bool = (a > b); break;
            case '>=': bool = (a >= b); break;
            case '<': bool = (a < b); break;
            case '<=': bool = (a <= b); break;
            default: throw `Unknown operator ${operator}`;
        }
        return bool ? options.fn(this) : options.inverse(this);
    },
    capFirstChar: (str) => {
        return str.replace(/\w\S*/g, txt => {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        });
    }
}