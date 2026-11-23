/**
 * Configuração do CLI (Studio e render). Nas APIs Node, passe as opções diretamente.
 * https://remotion.dev/docs/config
 */
import { Config } from "@remotion/cli/config";

Config.setRspack(true);
Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(92);
Config.setCodec("h264");
Config.setCrf(20);
Config.setPixelFormat("yuv420p");
Config.setOverwriteOutput(true);
Config.setDefaultPremountInSeconds(2);
Config.setDelayRenderTimeoutInMilliseconds(120000);
