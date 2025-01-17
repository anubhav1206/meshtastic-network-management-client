import { all, fork } from "redux-saga/effects";

import { algorithmsSaga } from "@features/algorithms/algorithmsSagas";
import { appConfigSaga } from "@app/features/appConfig/appConfigSagas";
import { configSaga } from "@features/config/configSagas";
import { devicesSaga } from "@features/device/deviceSagas";

export default function* rootSaga() {
  yield all([
    fork(algorithmsSaga),
    fork(appConfigSaga),
    fork(configSaga),
    fork(devicesSaga),
  ]);
}
