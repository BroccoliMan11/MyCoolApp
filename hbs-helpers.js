module.exports = {
    iff: function (a, operator, b, options) {
        let bool = false;
        console.log(operator);
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
    cap_first: function (string){
        let returnString = "";
        let arrOfString = string.split(" ");
        for (let i = 0; i < arrOfString.length; i++){
            for (let j = 0; j < arrOfString[i].length; j++){
                if (j == 0){
                    returnString += arrOfString[i][j].toUpperCase();
                } 
                else {
                    returnString += arrOfString[i][j].toLowerCase();
                }
            }
            returnString += " ";
        }
        return returnString;
    }
}