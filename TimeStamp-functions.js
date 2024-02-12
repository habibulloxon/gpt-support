const PAST_TIME_STAMP_DAYS = 10;

/**
 * Gets current time stamp
 * @returns {integer} - time stamp.
 */
const getCurrentTimeStamp = () => {
  let currentTimestamp = Math.floor(Date.now() / 1000);
  return currentTimestamp;
};

/**
 * Gets three days ago time stamp
 * @returns {integer} - three days ago time stamp.
 */
const getPastTimeStamp = () => {
  const newDate = new Date();
  newDate.setDate(newDate.getDate() - PAST_TIME_STAMP_DAYS);
  const pastTimeStamp = Math.floor(newDate.getTime() / 1000);
  return pastTimeStamp;
};
