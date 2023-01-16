'use strict';

/**
 * Cron config that gives you an opportunity
 * to run scheduled jobs.
 *
 * The cron format consists of:
 * [SECOND (optional)] [MINUTE] [HOUR] [DAY OF MONTH] [MONTH OF YEAR] [DAY OF WEEK]
 *
 * See more details here: https://strapi.io/documentation/v3.x/concepts/configurations.html#cron-tasks
 */

module.exports = {
  /**
   * Simple example.
   * Every monday at 1am.
   */
  /**  '* * * * * *': () => {
  *  console.log('Cron job running hourly');
  * }
  */
 // cron task evrery mon to fri at 15:00
   '0 0 15 * * 1-5': async () => {
    //run registries service closeAllCurrent
    await strapi.controllers.registries.closeAllCurrent();
  }, 
  //cron task every 1 minute registries service closeAllCurrent
  /* '0,10,20,30,40,50 * * * * *': async() => { 
    console.log('Cron job running every minute');
    await console.log(
      strapi.controllers.registries.getNowDate()

    ); 
  }  */



 };
