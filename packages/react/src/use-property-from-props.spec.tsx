import { Property } from '@frp-ts/core'
import { usePropertyFromProps } from './use-property-from-props'
import React, { useMemo } from 'react'
import { render } from '@testing-library/react'
import { constVoid } from '@frp-ts/utils'
import { useProperty } from './use-property'

interface TestProps<T> {
	readonly value: T
	readonly onProperty: (property: Property<T>) => void
}
function Test<T>(props: TestProps<T>) {
	const property = usePropertyFromProps(props.value)
	useMemo(() => props.onProperty(property), [property, props.onProperty])
	return <></>
}

describe('usePropertyFromProps', () => {
	it('returns new Property with initial value from props', () => {
		render(<Test value={1} onProperty={(property) => expect(property.get()).toBe(1)} />)
	})
	it('returns new Property that emits on new value in props', () => {
		const cb: (value: number) => void = jest.fn(constVoid)
		const onProperty = (property: Property<number>) => property.subscribe({ next: () => cb(property.get()) })
		const tree = render(<Test value={1} onProperty={onProperty} />)
		expect(cb).not.toHaveBeenCalled()
		tree.rerender(<Test value={2} onProperty={onProperty} />)
		expect(cb).toHaveBeenLastCalledWith(2)
		expect(cb).toHaveBeenCalledTimes(1)
		tree.rerender(<Test value={2} onProperty={onProperty} />)
		expect(cb).toHaveBeenCalledTimes(1)
	})
	it('syncs property value with the value from props during render', () => {
		interface ComponentProps<T> {
			readonly value: T
			readonly onRender: (valueFromProps: T, property: Property<T>) => void
		}

		function Component<T>(props: ComponentProps<T>) {
			const property = usePropertyFromProps(props.value)
			props.onRender(props.value, property)
			return <></>
		}

		const onRender = (valueFromProps: number, property: Property<number>) =>
			expect(valueFromProps).toBe(property.get())
		const tree = render(<Component value={1} onRender={onRender} />)
		tree.rerender(<Component value={2} onRender={onRender} />)
		tree.rerender(<Component value={3} onRender={onRender} />)
	})
	it('renders without errors with child consumer', () => {
		jest.spyOn(console, 'error').mockImplementation()

		interface ConsumerProps {
			property: Property<number>
		}
		const Consumer = (props: ConsumerProps) => {
			const value = useProperty(props.property)
			return <>{value}</>
		}
		interface ComponentProps {
			enabled: boolean
			value: number
		}
		const Component = (props: ComponentProps) => {
			const property = usePropertyFromProps(props.value)
			return <Consumer property={property} />
		}

		const tree = render(<Component enabled={true} value={1} />)
		tree.rerender(<Component enabled={false} value={2} />)

		expect(console.error).not.toBeCalled()
	})
})
