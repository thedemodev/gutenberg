/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import {
	withSelect,
	withDispatch,
} from '@wordpress/data';
import { compose, withSafeTimeout } from '@wordpress/compose';

class Edit extends Component {
	constructor() {
		super( ...arguments );
		this.updateList = this.updateList.bind( this );
		this.getAttributes = this.getAttributes.bind( this );
		this.setAttributes = this.setAttributes.bind( this );
		this.state = {
			order: [],
			selected: null,
		};
	}

	componentDidMount() {
		// Wait for the DOM to update.
		this.props.setTimeout( this.updateList );
	}

	componentDidUpdate( prevProps ) {
		if (
			this.props.contentRef === prevProps.contentRef &&
			this.props.selectionStart === prevProps.selectionStart
		) {
			return;
		}

		// Wait for the DOM to update.
		this.props.setTimeout( this.updateList );
	}

	updateList() {
		const attributePart = this.props.blockType.name.replace( '/', '-' );
		const attribute = `data-${ attributePart }-id`;

		// This is much faster than having to serialize the blocks and search
		// the HTML. Perhaps this should also be debounced.
		const anchors = document.querySelectorAll( `[${ attribute }]` );
		let selectedId;
		const order = Array.from( anchors ).map( ( element ) => {
			const id = ( element.getAttribute( 'href' ) || '' ).slice( 1 );

			if (
				element.getAttribute( 'data-rich-text-format-boundary' ) !== null &&
				element.closest( '.is-selected[contenteditable="true"]' ) !== null
			) {
				selectedId = id;
			}

			return id;
		} );

		this.setState( { order, selectedId } );
	}

	getAttributes() {
		const { footnotes } = this.props;
		const { order, selectedId } = this.state;
		return {
			footnotes: order.map( ( id ) => {
				const text = footnotes[ id ] || '';
				const isSelected = selectedId === id;
				return { id, text, isSelected };
			} ),
		};
	}

	setAttributes( { footnotes } ) {
		const { updateFootnotes } = this.props;

		updateFootnotes( footnotes.reduce( ( acc, footnote ) => {
			return { ...acc, [ footnote.id ]: footnote.text };
		}, {} ) );
	}

	render() {
		if ( ! this.state.order.length ) {
			return null;
		}

		const { edit: BlockEdit } = this.props.blockType;
		return (
			<BlockEdit
				attributes={ this.getAttributes() }
				setAttributes={ this.setAttributes }
				className="wp-block-footnotes"
			/>
		);
	}
}

export default compose( [
	withSafeTimeout,
	withSelect( ( select ) => {
		const { getEditorBlocks, getFootnotes } = select( 'core/editor' );
		const { getSelectionStart } = select( 'core/block-editor' );
		return {
			contentRef: getEditorBlocks(),
			footnotes: getFootnotes(),
			selectionStart: getSelectionStart(),
		};
	} ),
	withDispatch( ( dispatch ) => {
		const { updateFootnotes } = dispatch( 'core/editor' );
		return { updateFootnotes };
	} ),
] )( Edit );