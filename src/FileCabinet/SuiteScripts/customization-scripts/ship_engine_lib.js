define([
  'N/https'
], function (https) {

  const CONSTANTS = {
    url: {
      label: `https://api.shipengine.com/v1/labels`,
    },

    shipCarrierMap: {
      ups: {
        carrier_id: `se-952505`,
        service_code: `ups_next_day_air`,
      },
      fedex: {
        carrier_id: `se-952582`,
        service_code: `fedex_priority_overnight`,
      },
      usps: {
        carrier_id: `se-952484`,
        service_code: `usps_priority_mail`,
      },
    },

    carrierAccountMap: {
      ups: `31A6Y7`,
      fedex: `734769673`,
      usps: `oasisfinancial`,
    },
  };

  class ShipEngine {
    constructor({
      shipTo,
      shipFrom,
      packages,
      shipCarrier,
      // carrierId,
      // carrierCode,
    }) {
      this.shipTo = shipTo;
      this.shipFrom = shipFrom;
      this.packages = packages;
      this.shipCarrier = shipCarrier;
      // this.carrierId = carrierId;
      // this.carrierCode = carrierCode;
    }

    get apiKey() {
      return `CHFFJvB+9Cpb284Xa39eDj/He+2UBT0xxL1T2lhELYs`;
    }

    printShippingLabel() {
      const response = https.post({
        url: CONSTANTS.url.label,
        body: JSON.stringify({
          shipment: {
            ...CONSTANTS.shipCarrierMap[this.shipCarrier],
            // carrier_id: this.carrierId,
            // service_code: this.carrierCode,
            // service_code: '',

            ship_to: this.shipTo,
            ship_from: this.shipFrom,
            packages: this.packages,
          }
        }),
        headers: {
          'Content-Type': 'application/json',
          'API-Key': this.apiKey,
        }
      });

      log.audit({
        title: 'response',
        details: response,
      });

      return response;
    }
  };

  return ShipEngine;
})