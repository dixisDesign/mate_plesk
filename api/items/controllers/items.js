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

  async findOrder(ctx) {
    let entities;
    if (ctx.query._q) {
      entities = await strapi.services.items.search(ctx.query);
    } else {
      entities = await strapi.services.items.find(ctx.query);
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
        myMap[item.padre.id].items.push(item);
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
    await items.forEach((item) => {
      entity = strapi.services.items.update({ id: item }, users);
    });

    return entity;
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
