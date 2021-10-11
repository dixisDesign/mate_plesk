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
    async haveRegistries(ctx){
        let ids = JSON.parse(ctx.params.ids)
        let counted = 0
        await  Promise.all(
            ids.map(async (id) =>{
                const que = await strapi.services.registries.count({item:id})
                counted = counted + parseInt(que)
            })
        )
        return counted
    },
    async lapse(ctx){
        let registries = await strapi.services.registries.find(ctx.query)
        let byWork ={}
        let byUser ={}
        let byItem ={}
        registries.forEach(reg=>{
            reg['lapse']= this.registryTime(reg)
           
            if(!byWork[reg.work.name]){
                byWork[reg.work.name] = {"registries":[], "lapse":{"seconds":0, "minutes":0,"days":0,"hours":0}}
            }

            byWork[reg.work.name].registries.push(reg)
            byWork[reg.work.name].lapse.seconds += reg.lapse.seconds
            byWork[reg.work.name].lapse.minutes += reg.lapse.minutes 
            byWork[reg.work.name].lapse.hours += reg.lapse.hours 
            byWork[reg.work.name].lapse.days += reg.lapse.days 

            if (reg.users_permissions_user == null) {
                return
            }

            if(!byUser[reg.users_permissions_user.id]){
                byUser[reg.users_permissions_user.id]={"registries":[],"users_permissions_user":reg.users_permissions_user, "lapse":{"seconds":0, "minutes":0,"days":0,"hours":0}}
            }
            byUser[reg.users_permissions_user.id].registries.push(reg)
            byUser[reg.users_permissions_user.id].lapse.seconds += reg.lapse.seconds
            byUser[reg.users_permissions_user.id].lapse.minutes += reg.lapse.minutes
            byUser[reg.users_permissions_user.id].lapse.hours += reg.lapse.hours
            byUser[reg.users_permissions_user.id].lapse.days += reg.lapse.days


            if (!byItem[reg.item.id]) {
                byItem[reg.item.id]={"registries":[],"item":reg.item, "lapse":{"seconds":0, "minutes":0,"days":0,"hours":0}}
            }
            byItem[reg.item.id].registries.push(reg)
            byItem[reg.item.id].lapse.seconds += reg.lapse.seconds
            byItem[reg.item.id].lapse.minutes += reg.lapse.minutes
            byItem[reg.item.id].lapse.hours += reg.lapse.hours
            byItem[reg.item.id].lapse.days += reg.lapse.days
        }
            )
        return {"byWork":byWork,"byUser":byUser, "byItem":byItem, "registries":registries}
    },

    /**
     * PRIVATE FUNCTIONS
     */
    registryTime(reg){
        let time = (new Date(reg.final)).getTime() -  (new Date(reg.inicio)).getTime()
        
        return this.timeFormat(time)
    },
    timeFormat(time){
        let seconds = time / 1000
        let minutes = seconds / 60
        let hours = minutes / 60
        let days = hours / 24 
        const timer = {days,hours,minutes,seconds}
        return timer
    }


      
};
