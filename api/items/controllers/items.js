"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

/* module.exports = {}; */

const { sanitizeEntity } = require("strapi-utils");

module.exports = {
  /**
   * Retrieve records.
   *
   * @return {Array}
   */
  async lapseItem(item){
    let registries = await strapi.services.registries.find({item:item.id})
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
/* async totalLapseItem(item){
  let items = this.rchild(item.id)
  await Promise.all(
    items.map(async (item) => {
      let registries = await strapi.services.registries.find({item:item.id})
      
    })
  );


}, */
/**
 * PRIVATE FUNCTIONS
 */
registryTime(reg){
    let time = (new Date(reg.final)).getTime() - (new Date(reg.inicio)).getTime()
    
    return this.timeFormat(time)
},
timeFormat(time){
    let seconds = time / 1000
    let minutes = seconds / 60
    let hours = minutes / 60
    let days = hours / 24 
    const timer = {days,hours,minutes,seconds}
    return timer
},
  async findOrder(ctx) {
    let colums = [
      'id',
      'nombre',
      'description',
      'data',
      'tipo_item',
      'status',
      'inicio',
      'final',
      'padre',
      'empresa',
      'tipo',
      't',
      'items',
      'users_permissions_users'

    ]
    let entities;
    if (ctx.query._q) {
      entities = await strapi.services.items.search(ctx.query).model.fetchAll({
        colums: colums
      });
    } else {
      entities = await strapi.services.items.find(ctx.query)
    }
    
    let myMap = {};
    let tree = [];
    await Promise.all(
      entities.map(async (ent) => {
        ent.lapse = await this.lapseItem(ent)
        myMap[ent.id] = ent;
      })
    );
    entities.forEach((item) => {
      item.items = [];
      if (item.padre == null) {
        tree.push(item);
      } else {
        myMap[item.padre.id].items.push(item);
        myMap[item.padre.id].lapse.hours += item.lapse.hours
        myMap[item.padre.id].lapse.days += item.lapse.days
        myMap[item.padre.id].lapse.seconds += item.lapse.seconds
        myMap[item.padre.id].lapse.minutes += item.lapse.minutes
      }
    });
    
    return tree.map((entity) =>
      sanitizeEntity(entity, { model: strapi.models.items })
    );
  },

  async findOrderId(ctx) {
    let entities;
    let id = ctx.params.id
    console.log(id);
    if (ctx.query._q) {
      entities = await strapi.services.items.search(ctx.query);
    } else {
      entities = await strapi.services.items.find({status: id});
    }
    console.log(ctx);
    let myMap = {};
    let tree = [];
    entities.forEach((ent) => {
      myMap[ent.id] = ent;
    });
    entities.forEach((item) => {
      item.items = [];
      if (item.padre == null) {
        tree.push(item);
      } else {
        if(typeof myMap[item.padre.id] === 'object'){
          myMap[item.padre.id].items.push(item);
        }

      }
    });

    return tree.map((entity) =>
      sanitizeEntity(entity, { model: strapi.models.items })
    );
  },

  async findThread(ctx) {
    let myMap = {};
    let tree = [];
    let ids;
    let id = ctx.params.id;
    ids = await this.rchild(id);
    while (id != null) {
      console.log(id);
      id = await this.father(id);
      if (id != null) {
        ids.push(id);
      }
    }
    let aItem = [];
    await Promise.all(
      ids.map(async (id) => {
        const item = await strapi.services.items.find({ id: id });
        aItem.push(item);
      })
    );
    aItem.forEach((ent) => {
      myMap[ent.id] = ent;
    });
    aItem.forEach((item) => {
      item.items = [];
      if (item.padre == null) {
        tree.push(item);
      } else {
        myMap[item.padre.id].items.push(item);
      }
    });

    return tree.map((entity) =>
      sanitizeEntity(entity, { model: strapi.models.items })
    );
  },


  async ascendancy(ctx) {
    let entities = [];
    let id = ctx.params.id;
    entities.push(parseInt(id));
    while (id != null) {
      console.log(id);
      id = await this.father(id);
      if (id != null) {
        entities.push(id);
      }
    }
    return entities;
  },

  async getAllChilds(ctx) {
    let entities;
    let id = ctx.params.id;
    entities = await this.rchild(id);
    while (id != null) {
      console.log(id);
      id = await this.father(id);
      if (id != null) {
        entities.push(id);
      }
    }
    return entities;
  },

  async rchild(id) {
    let ids = [];
    const entities = await strapi.services.items.find({ padre: id });
    ids.push(parseInt(id));
    for (const entity of entities) {
      ids.push(...(await this.rchild(entity.id)));
    }

    return ids;
  },

  async father(id) {
    const entities = await strapi.services.items.find({ id: id });
    if (entities[0].padre) {
      return entities[0].padre.id;
    }
    return null;
  },

  async assignUsers(ctx) {
    let items = ctx.request.body.items;
    let users = { users_permissions_users: ctx.request.body.users };
    let entities = [];
    let entity;
    if (ctx.request.body.users.length > 0) {
      users["status"] = 2;
    } else {
      users["status"] = 1;
    }
    let aItem = [];
    await Promise.all(
      items.map(async (itema) => {
        const item = await strapi.services.items.update({ id: itema}, users);
        aItem.push(item);
      })
    );
    return aItem;
  },

  async recursiveItemStatus(ctx) {
    let items = ctx.request.body.items;
    let body = { status: ctx.request.body };
    let aItem = [];
    await Promise.all(
      items.map(async (itemId) => {
        const item = await strapi.services.items.update({ id: itemId }, body);
        aItem.push(item);
      })
    );
    return aItem;
  },
  async getItemByUserIdTree(ctx) {
    let userId = ctx.params.id;
    console.log(ctx.request.url);
    let params = { users_permissions_users: userId };
    let entities = await strapi.services.items.find(params);
    let myMap = {};
    let tree = [];
    if (entities.length > 0) {
      console.log("Hay entidades");
      entities.forEach((ent) => {
        myMap[ent.id] = ent;
      });
      entities.forEach((item) => {
        item.items = [];
        if (item.padre == null) {
          tree.push(item);
        } else {
          myMap[item.padre.id].items.push(item);
        }
      });

      return tree.map((entity) =>
        sanitizeEntity(entity, { model: strapi.models.items })
      );
    }
    console.log("no hay entidades");

    return [];
  },
};
