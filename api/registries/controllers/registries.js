'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
    async updateBulk(ctx){
        let body = ctx.request.body;
        let response =[]
        let registries
        await  Promise.all(body.map(async (registry)=>{   
            registries = await strapi.services.registries.update({id: registry.id}, registry);
            response.push(registries);
        }))

        return response

      },
    async supervisor(ctx){
        let users =  await strapi.query('user', 'users-permissions').find()
        let registries
        await  Promise.all(users.map(async (user)=>{
            let filter = {validado:'registrado', users_permissions_user:user.id }
            registries = await strapi.services.registries.count(filter)
            user.registriesCount = registries
        }))
        
       console.log('supervisor');
       return users
      },
      
};
