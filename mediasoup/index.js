const mediasoup = require("mediasoup");
const config = require('./../config');

let obj = {
    // variable
    worker: undefined,
    router: undefined,
    producerTransport: undefined,
    consumerTransport: undefined,
    producer: undefined,
    consumer: undefined,
    // methods
    async runMediasoupWorker() {
        console.log("[*] runMediasoupWorker")
        obj.worker = await mediasoup.createWorker({
            logLevel: 'debug',
        });
    
        obj.worker.on('died', () => {
            console.error('mediasoup worker died, exiting in 2 seconds... [pid:%d]', worker.pid);
            setTimeout(() => process.exit(1), 2000);
        });
    
        // const mediaCodecs = config.mediasoup.router.mediaCodecs;
        const mediaCodecs = config.mediasoup.router.mediaCodecs;

        obj.router = await obj.worker.createRouter({ mediaCodecs });
    },
    async createWebRtcTransport() {
        const {
          maxIncomingBitrate,
          initialAvailableOutgoingBitrate
        } = config.mediasoup.webRtcTransport;
      
        const transport = await obj.router.createWebRtcTransport({
          listenIps: config.mediasoup.webRtcTransport.listenIps,
          enableUdp: true,
          enableTcp: true,
          preferUdp: true,
          initialAvailableOutgoingBitrate,
        });
        if (maxIncomingBitrate) {
          try {
            await transport.setMaxIncomingBitrate(maxIncomingBitrate);
          } catch (error) {
          }
        }
        return {
          transport,
          params: {
            id: transport.id,
            iceParameters: transport.iceParameters,
            iceCandidates: transport.iceCandidates,
            dtlsParameters: transport.dtlsParameters
          },
        };
      },
      
      async createConsumer(producer, rtpCapabilities) {
        if (!obj.router.canConsume(
          {
            producerId: producer.id,
            rtpCapabilities,
          })
        ) {
          console.error('can not consume');
          return;
        }
        try {
          obj.consumer = await obj.consumerTransport.consume({
            producerId: producer.id,
            rtpCapabilities,
            paused: producer.kind === 'video',
          });
        } catch (error) {
          console.error('consume failed', error);
          return;
        }
      
        if (obj.consumer.type === 'simulcast') {
          await obj.consumer.setPreferredLayers({ spatialLayer: 2, temporalLayer: 2 });
        }
      
        return {
          producerId: producer.id,
          id: obj.consumer.id,
          kind: obj.consumer.kind,
          rtpParameters: obj.consumer.rtpParameters,
          type: obj.consumer.type,
          producerPaused: obj.consumer.producerPaused
        };
      }
      
}
module.exports = obj;