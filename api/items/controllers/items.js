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
  async lapseItem(item,showRegistries=true) {
    let registries = await strapi.services.registries.find({ item: item.id });
    let byWork = {};
    let byUser = {};
    let byItem = {};
    registries.forEach((reg) => {
      reg["lapse"] = this.registryTime(reg);
      if (!byWork[reg.work.name]) {
        byWork[reg.work.name] = {
          registries: [],
          lapse: { seconds: 0, minutes: 0, days: 0, hours: 0 },
          users: {},
        };
      }
      if (showRegistries){byWork[reg.work.name].registries.push(reg);}
      byWork[reg.work.name].lapse.seconds += reg.lapse.seconds;
      byWork[reg.work.name].lapse.minutes += reg.lapse.minutes;
      byWork[reg.work.name].lapse.hours += reg.lapse.hours;
      byWork[reg.work.name].lapse.days += reg.lapse.days;

      if (reg.users_permissions_user == null) {
        return;
      }

      if (!byWork[reg.work.name].users[reg.users_permissions_user.id]) {
        byWork[reg.work.name].users[reg.users_permissions_user.id] = {
          lapse: { seconds: 0, minutes: 0, days: 0, hours: 0 },
          users_permissions_user: reg.users_permissions_user,
        };
      }
      byWork[reg.work.name].users[
        reg.users_permissions_user.id
      ].lapse.seconds += reg.lapse.seconds;
      byWork[reg.work.name].users[
        reg.users_permissions_user.id
      ].lapse.minutes += reg.lapse.minutes;
      byWork[reg.work.name].users[reg.users_permissions_user.id].lapse.hours +=
        reg.lapse.hours;
      byWork[reg.work.name].users[reg.users_permissions_user.id].lapse.days +=
        reg.lapse.days;

      if (!byUser[reg.users_permissions_user.id]) {
        byUser[reg.users_permissions_user.id] = {
          registries: [],
          users_permissions_user: reg.users_permissions_user,
          lapse: { seconds: 0, minutes: 0, days: 0, hours: 0 },
          works: {},
        };
      }
      if (showRegistries){byUser[reg.users_permissions_user.id].registries.push(reg);}
      byUser[reg.users_permissions_user.id].lapse.seconds += reg.lapse.seconds;
      byUser[reg.users_permissions_user.id].lapse.minutes += reg.lapse.minutes;
      byUser[reg.users_permissions_user.id].lapse.hours += reg.lapse.hours;
      byUser[reg.users_permissions_user.id].lapse.days += reg.lapse.days;

      if (!byUser[reg.users_permissions_user.id].works[reg.work.name]) {
        byUser[reg.users_permissions_user.id].works[reg.work.name] = {
          lapse: { seconds: 0, minutes: 0, days: 0, hours: 0 },
          work: reg.work,
        };
      }
      byUser[reg.users_permissions_user.id].works[
        reg.work.name
      ].lapse.seconds += reg.lapse.seconds;
      byUser[reg.users_permissions_user.id].works[
        reg.work.name
      ].lapse.minutes += reg.lapse.minutes;
      byUser[reg.users_permissions_user.id].works[reg.work.name].lapse.hours +=
        reg.lapse.hours;
      byUser[reg.users_permissions_user.id].works[reg.work.name].lapse.days +=
        reg.lapse.days;

      if (!byItem[reg.item.id]) {
        byItem[reg.item.id] = {
          registries: [],
          item: reg.item,
          lapse: { seconds: 0, minutes: 0, days: 0, hours: 0 },
        };
      }
      if (showRegistries){byItem[reg.item.id].registries.push(reg);}
      byItem[reg.item.id].lapse.seconds += reg.lapse.seconds;
      byItem[reg.item.id].lapse.minutes += reg.lapse.minutes;
      byItem[reg.item.id].lapse.hours += reg.lapse.hours;
      byItem[reg.item.id].lapse.days += reg.lapse.days;
    });
    return {
      byWork: byWork,
      byUser: byUser,
      byItem: byItem,
      registries: showRegistries? registries:[],
    };
  },

  async totalLapseItem(item) {
    let items = await this.rchild(item.id);

    let totalLapse = [];
    await Promise.all(
      items.map(async (it) => {
        console.log(it);
        let registries = await strapi.services.registries.find({ item: it });
        registries.forEach((element) => {
          let time =
            new Date(element.final).getTime() -
            new Date(element.inicio).getTime();
          totalLapse.push(time);
        });
      })
    );

    return this.timeFormat(totalLapse.reduce((a, b) => a + b, 0));
  },

  /**
   * PRIVATE FUNCTIONS
   */
  registryTime(reg) {
    let time = new Date(reg.final).getTime() - new Date(reg.inicio).getTime();

    return this.timeFormat(time);
  },

  timeFormat(time) {
    let seconds = time / 1000;
    let minutes = seconds / 60;
    let hours = minutes / 60;
    let days = hours / 24;
    const timer = { days, hours, minutes, seconds };
    return timer;
  },

  /**
   * GET THE ITEM AND THE CHILDS WITH THE REGISTRIES, THE LAPSE OF EACHONE
   * AND THE SUM OF THE CHILDS ON EACH FATHER, BY ITEM,BY WORK AND BY users_permissions_users
   * @params {Array} id of item *
   */
  async getRegistries(id) {
    let registries = await strapi.services.registries.find({ item: id });
    return registries;
  },
  async childLapse(ctx) {
    let id = ctx.params.id;
    let items = await this.rchild(id);
    console.log(items);
    let myMap = {};
    await Promise.all(
      items.map(async (item) => {
        let asc = await this.ascen(item, id);
        console.log(asc);
        let itemInfo = await this.getItem(item);
        let registries = await this.getRegistries(item);
        //myMap[item] = { item: itemInfo };

        asc.forEach(async (element) => {
          if (!myMap[element]) {
            myMap[element] = {};
          }
          if (!myMap[element].registries) {
            myMap[element].registries = [];
          }
          if (!myMap[element].lapse) {
            myMap[element].lapse = {};
          }
          myMap[element].registries.push(...registries);
        });
      })
    );
    await items.forEach(async (item) => {
      myMap[item].lapse = await this.getLapseOfItem(myMap[item].registries);
      delete myMap[item].registries;
    });
    
    return myMap;
  },
  async getItem(id) {
    let item = await strapi.services.items.findOne({ id });
    return item;
  },
  async getLapseOfItem(registries) {
    let byWork = {};
    let byUser = {};
    let byItem = {};

    registries.forEach((reg) => {
      reg["lapse"] = this.registryTime(reg);
      if (!byWork[reg.work.name]) {
        byWork[reg.work.name] = {
          registries: [],
          lapse: { seconds: 0, minutes: 0, days: 0, hours: 0 },
        };
      }
      byWork[reg.work.name].registries.push(reg);
      byWork[reg.work.name].lapse.seconds += reg.lapse.seconds;
      byWork[reg.work.name].lapse.minutes += reg.lapse.minutes;
      byWork[reg.work.name].lapse.hours += reg.lapse.hours;
      byWork[reg.work.name].lapse.days += reg.lapse.days;

      if (reg.users_permissions_user == null) {
        return;
      }

      if (!byUser[reg.users_permissions_user.id]) {
        byUser[reg.users_permissions_user.id] = {
          registries: [],
          users_permissions_user: reg.users_permissions_user,
          lapse: { seconds: 0, minutes: 0, days: 0, hours: 0 },
        };
      }
      byUser[reg.users_permissions_user.id].registries.push(reg);
      byUser[reg.users_permissions_user.id].lapse.seconds += reg.lapse.seconds;
      byUser[reg.users_permissions_user.id].lapse.minutes += reg.lapse.minutes;
      byUser[reg.users_permissions_user.id].lapse.hours += reg.lapse.hours;
      byUser[reg.users_permissions_user.id].lapse.days += reg.lapse.days;

      if (!byItem[reg.item.id]) {
        byItem[reg.item.id] = {
          registries: [],
          item: reg.item,
          lapse: { seconds: 0, minutes: 0, days: 0, hours: 0 },
        };
      }
      byItem[reg.item.id].registries.push(reg);
      byItem[reg.item.id].lapse.seconds += reg.lapse.seconds;
      byItem[reg.item.id].lapse.minutes += reg.lapse.minutes;
      byItem[reg.item.id].lapse.hours += reg.lapse.hours;
      byItem[reg.item.id].lapse.days += reg.lapse.days;
    });

    return { byWork, byUser, byItem };
  },

  async ascen(id, stop) {
    let entities = [];
    entities.push(parseInt(id));

    while (id != null) {
      if (stop == id) {
        break;
      }

      id = await this.father(id);
      if (id != null) {
        entities.push(id);
      }
    }
    return entities;
  },

  timeFormat(time) {
    let seconds = time / 1000;
    let minutes = seconds / 60;
    let hours = minutes / 60;
    let days = hours / 24;
    const timer = { days, hours, minutes, seconds };
    return timer;
  },

  /**
 * let myMap ={}
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
 */

  async ordenados(ctx){
     let colums = [
      "id",
      "nombre",
      "description",
      "data",
      "tipo_item",
      "status",
      "inicio",
      "final", 
      "padre",
      "empresa",
      "tipo",
      "t", 
      "items",
      "users_permissions_users",
      "lapse",
      "totalLapse"  
    ]; 
    let entities = await strapi.services.items.find(ctx.query) 
    /* const entities = await strapi
    .query('items')
    .model.fetchAll()  */
      entities.map((element)=>{
        
      Object.keys(element).forEach((key)=>{
        if(colums.indexOf(key) == -1){
          delete element[key]
        }
      })
    }) 
    
    let myMap = {};
    let tree = [];
    await Promise.all(
      entities.map(async (ent) => {
        ent.lapse = await this.lapseItem(ent, false);
        ent.totalLapse = await this.totalLapseItem(ent);
        myMap[ent.id] = ent;
      })
    );
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
    
    
  },      

/**Mobile endpoints */

async mobileOrdered(ctx){

  let items = await strapi.services.items.find(ctx.query)
  let entities = []
  items.forEach((item)=>{
    entities.push(
      {
      id: item.id,
      padre: item.padre,
      nombre: item.nombre,
      status: item.status,
      users_permissions_users:this.OnlyNombreAndId(item.users_permissions_users),
      items:[],
      inicio:item.inicio,
      final:item.final
    }
    )
  })

  let myMap = {};
  let tree = [];
  await Promise.all(
    entities.map(async (ent) => {
     // ent.lapse = await this.lapseItem(ent, false);
      ent.totalLapse = await this.totalLapseItem(ent);
      myMap[ent.id] = ent;
    })
  );
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




//return entities




},
/** Return only Id and Name of users_permissions_users */
OnlyNombreAndId(users_permissions_users){
  let usuarios = users_permissions_users.map((user)=>{
    return {
      id:user.id,
      name:user.name
    }
  })
  return usuarios


},


  async findOrder(ctx) {
    let colums = [
      "id",
      "nombre",
      "description",
      "data",
      "tipo_item",
      "status",
      "inicio",
      "final",
      "padre",
      "empresa",
      "tipo",
      "t",
      "items",
      "users_permissions_users",
    ];
    let entities;
    if (ctx.query._q) {
      entities = await strapi.services.items.search(ctx.query).model.fetchAll({
        colums: colums,
      });
    } else {
      //entities = await strapi.services.items.find(ctx.query);
      entities = await strapi.services.items.find(ctx.query)
    }

    let myMap = {};
    let tree = [];
    await Promise.all(
      entities.map(async (ent) => {
        ent.lapse = await this.lapseItem(ent);
        ent.totalLapse = await this.totalLapseItem(ent);
        myMap[ent.id] = ent;
      })
    );
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
  },

  async findOrderId(ctx) {
    let entities;
    let id = ctx.params.id;
    console.log(id);
    if (ctx.query._q) {
      entities = await strapi.services.items.search(ctx.query);
    } else {
      entities = await strapi.services.items.find({ status: id });
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
        if (typeof myMap[item.padre.id] === "object") {
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
        const item = await strapi.services.items.update({ id: itema }, users);
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
          if (myMap[item.padre.id]) {
            myMap[item.padre.id].items.push(item);
          }
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
