import React from 'react';
import {Header} from './HeaderList'; // Import the Header interface

interface HeaderItemProps {
    hash: string;
    header: Header;
    isValid?: boolean;
}

const HeaderItem: React.FC<HeaderItemProps> = ({hash, header, isValid}) => {
    return (
        <div className="header-item">
            <div>
                <strong>Block #{header.number}</strong> - Hash: {hash}
            </div>
            <div>
                {isValid === undefined ? (
                    <span>Verifying...</span>
                ) : isValid ? (
                    <span style={{color: 'green'}}>✅ Verified</span>
                ) : (
                    <span style={{color: 'red'}}>❌ Verification Failed</span>
                )}
            </div>
        </div>
    );
};

export default HeaderItem;
