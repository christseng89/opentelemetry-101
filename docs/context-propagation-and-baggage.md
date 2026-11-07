# Context propagation and baggage

### Use the default W3C context propagation

The current Node SDK uses W3C Trace Context and W3C Baggage propagation by
default. No custom `CompositePropagator` configuration is required.

### Set the baggage
Create the baggage before we call auth service
```
import { context, propagation } from '@opentelemetry/api';

const baggage = propagation.createBaggage({
    key1: {
        value: "value1"
    }
})
const contextWithBaggage = propagation.setBaggage(context.active(), baggage);
```

### Use the context with baggage to call auth service
```
context.with(contextWithBaggage, async () => {
    /// Any new span in this context will have the baggage. 
})

```

### Extract the baggage in downstream service

```
const baggage = propagation.getActiveBaggage()
```
