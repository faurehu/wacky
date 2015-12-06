function roundToTwo(num) {
    return +(Math.round(num + "e+2")  + "e-2");
}

module.exports = function(user1, user2) {

  var squares = [
    Math.pow(roundToTwo(user1.openness * 100) - roundToTwo(user2.openness * 100),2),
    Math.pow(roundToTwo(user1.conscientiousness * 100) - roundToTwo(user2.conscientiousness * 100),2),
    Math.pow(roundToTwo(user1.extraversion * 100) - roundToTwo(user2.extraversion * 100),2),
    Math.pow(roundToTwo(user1.agreeableness * 100) - roundToTwo(user2.agreeableness * 100),2),
    Math.pow(roundToTwo(user1.emotional_range * 100) - roundToTwo(user2.emotional_range * 100), 2)
  ];

  var sumSquares = squares.reduce(function(prev,current){return  current + prev;}, 0);

  return (1/(1+ Math.sqrt(sumSquares))) * 1000;
}
