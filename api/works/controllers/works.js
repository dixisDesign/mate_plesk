'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {

    async worksOrder(ctx){
        let works = await strapi.services.works.find(ctx.query)
        let myMap ={}
        let tree =[]
        works.forEach(work => {
            myMap[work.id] = work
            myMap[work.id].childs = []
            if (myMap[work.id].father == null){
                tree.push(myMap[work.id])
            }else{
                if (typeof myMap[work.father.id] === "object") {
                    myMap[work.father.id].childs.push(work);
                  }
            }
        }); 
        return tree
    }
};
