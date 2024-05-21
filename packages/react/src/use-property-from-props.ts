import { newEmitter, newProperty, Property, now } from '@frp-ts/core'
import { useEffect, useMemo, useRef } from 'react'

export const usePropertyFromProps = <Value>(value: Value): Property<Value> => {
	const didMount = useRef(false)
	const emitter = useRef(newEmitter())
	const valueRef = useRef(value)
	valueRef.current = value

	useEffect(() => {
		if (didMount.current) {
			emitter.current.next(now())
		} else {
			didMount.current = true
		}
	}, [value])

	return useMemo(() => newProperty(() => valueRef.current, emitter.current.subscribe), [])
}
