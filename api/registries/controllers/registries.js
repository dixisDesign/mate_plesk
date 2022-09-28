"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  async updateBulk(ctx) {
    let body = ctx.request.body;
    let response = [];
    let registries;
    await Promise.all(
      body.map(async (registry) => {
        registries = await strapi.services.registries.update(
          { id: registry.id },
          registry
        );
        response.push(registries);
      })
    );

    return response;
  },
  /** registries/supervisor endpoint
   * return registries that are not supervised.
   */
  async supervisor(ctx) {
    let users = await strapi.query("user", "users-permissions").find();
    let registries;
    await Promise.all(
      users.map(async (user) => {
        let filter = {
          validado: "registrado",
          users_permissions_user: user.id,
        };
        registries = await strapi.services.registries.count(filter);
        user.registriesCount = registries;
      })
    );

    return users;
  },
  /** /registries/have-registries/:ids endpoint
   *  return count of registries that have the id of item
   */
  async haveRegistries(ctx) {
    let ids = JSON.parse(ctx.params.ids);
    let counted = 0;
    await Promise.all(
      ids.map(async (id) => {
        const que = await strapi.services.registries.count({ item: id });
        counted = counted + parseInt(que);
      })
    );
    return counted;
  },
  /** registries/lapse endpoint
   * return registries lapse of time by work, by user and by item
   */
  async lapse(ctx) {
    let registries = await strapi.services.registries.find(ctx.query);
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

    return {
      byWork: byWork,
      byUser: byUser,
      byItem: byItem,
      registries: registries,
    };
  },
  /** registries/dated
   * return registries by date
   */

  async ascendancyId(id) {
    let entities = [];
    entities.push(parseInt(id));
    while (id != null) {
      id = await this.father(id);
      if (id != null) {
        entities.push(id);
      }
    }
    return entities;
  },
  async getItem(id) {
    let item = await strapi.services.items.findOne({ id });
    return item;
  },
  async father(id) {
    const entities = await strapi.services.items.find({ id: id });
    if (entities[0].padre) {
      return entities[0].padre.id;
    }
    return null;
  },
  async breadCrumb(id) {
    if (!id || id === null || id === undefined) {
      return null;
    }
    let ids = await this.ascendancyId(id);
    let items = [];
    await Promise.all(
      ids.map(async (idItem) => {
        let item = await this.getItem(idItem);
        items.push({
          id: item.id,
          nombre: item.nombre,
          tipo: { id: item.tipo.id, tipo: item.tipo.tipo },
        });
      })
    );
    return items;
  },

  async byDate(ctx) {
    let registries = await strapi.services.registries.find(ctx.query);
    let byDate = { dates: {}, tiempo: {} };
    await Promise.all(
      registries.map(async (reg) => {
        console.log(reg.id);
        if (!reg.inicio) {
          return;
        }
        reg.item.breadcrumb = await this.breadCrumb(reg.item.id);
        let d = reg.inicio.split("T")[0];
        if (byDate.dates[d]) {
          reg.sumaTiempo = this.registryTime(reg);
          byDate.tiempo[d] = this.sumRegistries(
            byDate.tiempo[d],
            reg.sumaTiempo
          );
          byDate.dates[d].push(reg);
        } else {
          reg.sumaTiempo = this.registryTime(reg);
          byDate.dates[d] = [];
          byDate.tiempo[d] = { seconds: 0, minutes: 0, hours: 0, days: 0 };
          byDate.tiempo[d] = this.sumRegistries(
            byDate.tiempo[d],
            reg.sumaTiempo
          );
          byDate.dates[d].push(reg);
        }
      })
    );

    const dates = Object.keys(byDate);
    return byDate;
  },
  async RegistriesByDate(ctx) {
    let registries = await strapi.services.registries.find(ctx.query);
    let byDate = { dates: {}, tiempo: {} };
    await Promise.all(
      registries.map(async (reg) => {
        if (!reg.inicio) {
          return;
        }
        let d = reg.inicio.split("T")[0];
        if (byDate.dates[d]) {
          reg.sumaTiempo = this.registryTime(reg);
          byDate.tiempo[d] = this.sumRegistries(
            byDate.tiempo[d],
            reg.sumaTiempo
          );
          byDate.dates[d].push(reg);
        } else {
          reg.sumaTiempo = this.registryTime(reg);
          byDate.dates[d] = [];
          byDate.tiempo[d] = { seconds: 0, minutes: 0, hours: 0, days: 0 };
          byDate.tiempo[d] = this.sumRegistries(
            byDate.tiempo[d],
            reg.sumaTiempo
          );
          byDate.dates[d].push(reg);
        }
      })
    );

    const dates = Object.keys(byDate);
    return byDate;
  },
  sumRegistries(regA, RegB) {
    let sum = { seconds: 0, minutes: 0, hours: 0, days: 0 };
    sum.seconds = regA.seconds + RegB.seconds;
    sum.minutes = regA.minutes + RegB.minutes;
    sum.hours = regA.hours + RegB.hours;
    sum.days = regA.days + RegB.days;
    return sum;
  },

  async listByUser(ctx) {
    let registries = await strapi.services.registries.find(ctx.query);
    await Promise.all(
      registries.map(async (reg) => {
        reg.item.breadcrumb = await this.breadCrumb(reg.item.id);
      })
    );
    return registries;
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

  async insertRegistry(ctx) {
    let registry = ctx.request.body;
    const regToCheck = {
      inicio: registry.inicio,
      final: registry.final,
      users_permissions_user: this.idOrObject(registry.users_permissions_user),
      item: this.idOrObject(registry.item),
      data: registry.data,
      observaciones: registry.observaciones,
      validado: registry.validado,
      work: this.idOrObject(registry.work),
      empresa: this.idOrObject(registry.empresa),
      media: registry.media,
    };
    return this.checkRegistryRange(regToCheck);
  },

  async overwriteRegistry(ctx) {
    let registry = ctx.request.body;
    const regToCheck = {
      inicio: registry.inicio,
      final: registry.final,
      users_permissions_user: this.idOrObject(registry.users_permissions_user),
      item: this.idOrObject(registry.item),
      data: registry.data || null,
      observaciones: registry.observaciones || null,
      validado: registry.validado || "Registrado",
      work: this.idOrObject(registry.work),
      empresa: this.idOrObject(registry.empresa) || null,
      media: registry.media || null,
    };
    let todo = await this.checkRegistryRange(regToCheck);
    let result = {};
    result = await this.getPromiseOverwriteRegistry(todo);
    return result;
  },

  async getPromiseOverwriteRegistry(todo) {
    let result = { post: [], put: [], delete: [] };
    await Promise.all(
      todo.post.map(async (reg) => {
        let newReg = await strapi.services.registries.create(reg);
        const a = newReg;
        result["post"].push(a);
      })
    );

    await Promise.all(
      todo.put.map(async (reg) => {
        let newReg = await strapi.services.registries.update(
          { id: reg.id },
          reg
        );
        const a = newReg;
        result["put"].push(a);
      })
    );

    await Promise.all(
      todo.delete.map(async (reg) => {
        let newReg = await strapi.services.registries.delete({ id: reg.id });
        const a = newReg;
        result["delete"].push(a);
      })
    );
    return result;
  },

  idOrObject(element) {
    if (element && element.id) {
      return element.id;
    }
    return element;
  },
  async checkRegistryRange(data) {
    //const data = ctx.request.body;
    const inicio = data.inicio;
    const final = data.final;
    const users_permissions_user = data.users_permissions_user
      ? data.users_permissions_user
      : "";

    if (inicio > final) {
      return { error: "inicio mayor que final" };
    }

    const filter = {
      inicio_gte: inicio.substring(0, 10) + "T00:00:00Z",
      inicio_lte: final.substring(0, 10) + "T23:59:00Z",
      users_permissions_user,
    };
    const filter2 = {
      final_gte: inicio.substring(0, 10) + "T00:00:00Z",
      final_lte: final.substring(0, 10) + "T23:59:00Z",
      users_permissions_user,
    };
    //console.log(filter, filter2);
    let registries = await strapi.services.registries.find(filter);
    let registries2 = await strapi.services.registries.find(filter2);
    const junts = await Promise.all(
      registries2.map((reg) => {
        if (!registries.find((reg2) => reg2.id === reg.id)) {
          registries.push(reg);
        }
      })
    );
    let r = {};
    r.put = [];
    r.delete = [];
    r.post = [data];

    registries.map(async (original) => {
      console.log(
        "######################################################################"
      );
      console.debug("ID", original.id);
      console.log("Original.inicio", original.inicio.slice(0, 16));
      console.log("data.inicio", data.inicio.slice(0, 16));
      console.warn("Original.final", original.final.slice(0, 16));
      console.warn("data.final", data.final.slice(0, 16));

      console.log(
        "######################################################################"
      );
      /*   console.log(data); */

      if (
        original.inicio.slice(0, 16) == data.inicio.slice(0, 16) &&
        original.final.slice(0, 16) == data.final.slice(0, 16)
      ) {
        console.log("reset post");
        r.post = [];
      } else {
        let a = await this.compareRegistries(original, data);
        //console.log(a);

        if (a.put.length > 0) {
          r.put.push(a.put[0]);
        }
        if (a.post) {
          r.post.push(a.post);
        }
        if (a.delete) {
          r.delete.push(a.delete[0]);
        }
      }
    });

    return r;
  },

  async compareRegistries(original, nuevo) {
    let result = { put: [] };
    // AL FINAL PISANDO
    if (
      original.inicio < nuevo.inicio &&
      original.final >= nuevo.inicio &&
      original.final <= nuevo.final
    ) {
      result.put = [
        {
          inicio: original.inicio,
          final: nuevo.inicio,
          id: original.id,
          item: original.item.id,
          work: original.work.id,
          users_permissions_user: original.users_permissions_user.id,
        },
      ];
    }
    //INTERMEDIO
    else if (original.inicio < nuevo.inicio && original.final > nuevo.final) {
      let originalPart;
      originalPart = {
        inicio: nuevo.final,
        final: original.final,
        item: original.item.id,
        work: original.work.id,
        users_permissions_user: original.users_permissions_user.id,
        observaciones: original.observaciones,
        media: original.media,
        empresa: original.empresa.id,
      };

      result.post = originalPart;

      result.put = [
        {
          inicio: original.inicio,
          final: nuevo.inicio,
          item: original.item.id,
          work: original.work.id,
          id: original.id,
        },
      ];
    }
    //AL INICIO PISANDO
    else if (
      original.inicio < nuevo.final &&
      original.inicio >= nuevo.inicio &&
      original.final > nuevo.final
    ) {
      result.put = [
        {
          inicio: nuevo.final,
          final: original.final,
          id: original.id,
          item: original.item.id,
          work: original.work.id,
          users_permissions_user: original.users_permissions_user.id,
        },
      ];
    }
    //SOBRE_ESCRIBE
    else if (nuevo.inicio < original.inicio && nuevo.final > original.final) {
      result.delete = [original];
    }
    return result;
  },
};
