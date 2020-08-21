/*handlebars helper function (functions to be called when rendering pages)*/

module.exports = {
    /*Summary: check if variables equal to certain values
    Inputs: a = value of variable checking (STRING), operator = comparison operator (STRING)
            b = value checking (STRING), options = object passed in by handlebars (OBJECT)
    Output: BOOLEAN
     */
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
    }
}